import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { sumNumbers, toNumber } from '../../common/utils/number.util';
import { JobQueueService } from '../../jobs/job-queue.service';
import { PostEntity } from '../posts/entities/post.entity';
import { QuestionEntity } from '../questions/entities/question.entity';
import { UserEntity } from '../users/entities/user.entity';
import { TransactionEntity } from '../wallet/entities/transaction.entity';
import { WithdrawalEntity } from '../wallet/entities/withdrawal.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly jobQueueService: JobQueueService,
    private readonly walletService: WalletService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questionsRepository: Repository<QuestionEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
    @InjectRepository(WithdrawalEntity)
    private readonly withdrawalsRepository: Repository<WithdrawalEntity>,
  ) {}

  async getDashboard() {
    const [users, posts, questions, transactions] = await Promise.all([
      this.usersRepository.count(),
      this.postsRepository.count(),
      this.questionsRepository.count(),
      this.transactionsRepository.find({
        where: {
          status: 'completed',
        },
      }),
    ]);

    return {
      users,
      posts,
      questions,
      revenue: sumNumbers(
        transactions
          .filter((transaction) =>
            ['question_to_ai', 'withdrawal_fee'].includes(transaction.type),
          )
          .map((transaction) => transaction.amount),
      ),
    };
  }

  async listTransactions() {
    const items = await this.transactionsRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 200,
    });

    const relatedUserIds = Array.from(
      new Set(
        items.flatMap((item) =>
          [item.senderId, item.receiverId].filter(
            (value): value is string => Boolean(value),
          ),
        ),
      ),
    );

    const users = relatedUserIds.length
      ? await this.usersRepository.find({
          where: {
            id: In(relatedUserIds),
          },
        })
      : [];

    const userMap = new Map(users.map((user) => [user.id, user]));

    return {
      items: items.map((item) => ({
        ...item,
        amount: toNumber(item.amount),
        sender: item.senderId
          ? this.serializeAdminUser(userMap.get(item.senderId))
          : null,
        receiver: item.receiverId
          ? this.serializeAdminUser(userMap.get(item.receiverId))
          : null,
      })),
    };
  }

  async listPosts() {
    const items = await this.postsRepository.find({
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
      take: 200,
    });

    const authorIds = Array.from(new Set(items.map((item) => item.authorId)));
    const authors = authorIds.length
      ? await this.usersRepository.find({
          where: {
            id: In(authorIds),
          },
        })
      : [];

    const authorMap = new Map(authors.map((author) => [author.id, author]));

    return {
      items: items.map((item) => ({
        ...item,
        viewCount: toNumber(item.viewCount),
        author: this.serializeAdminUser(authorMap.get(item.authorId)),
      })),
    };
  }

  async approvePost(postId: string) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const shouldQueueEmbedding = post.status !== 'published';
    post.status = 'published';
    post.publishedAt = post.publishedAt ?? new Date();
    await this.postsRepository.save(post);

    if (shouldQueueEmbedding) {
      this.queuePostEmbedding(post.id);
    }

    return post;
  }

  async rejectPost(postId: string) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    post.status = 'archived';
    await this.postsRepository.save(post);

    return post;
  }

  async listWithdrawals() {
    const items = await this.withdrawalsRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 200,
    });

    const relatedUserIds = Array.from(
      new Set(
        items.flatMap((item) =>
          [item.userId, item.approvedBy].filter(
            (value): value is string => Boolean(value),
          ),
        ),
      ),
    );

    const users = relatedUserIds.length
      ? await this.usersRepository.find({
          where: {
            id: In(relatedUserIds),
          },
        })
      : [];

    const userMap = new Map(users.map((user) => [user.id, user]));

    return {
      items: items.map((item) => ({
        ...item,
        amount: toNumber(item.amount),
        feeAmount: toNumber(item.feeAmount),
        totalDebit: toNumber(item.amount) + toNumber(item.feeAmount),
        user: this.serializeAdminUser(userMap.get(item.userId)),
        approvedByAdmin: item.approvedBy
          ? this.serializeAdminUser(userMap.get(item.approvedBy))
          : null,
      })),
    };
  }

  async approveWithdrawal(withdrawalId: string, adminId: string) {
    return this.dataSource.transaction(async (manager) => {
      const withdrawalRepository = manager.getRepository(WithdrawalEntity);
      const walletRepository = manager.getRepository(WalletEntity);
      const transactionRepository = manager.getRepository(TransactionEntity);

      const withdrawal = await withdrawalRepository.findOne({
        where: {
          id: withdrawalId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!withdrawal) {
        throw new NotFoundException('Withdrawal not found.');
      }

      if (withdrawal.status !== 'pending') {
        throw new BadRequestException(
          `Withdrawal has already been ${withdrawal.status}.`,
        );
      }

      const wallet = await walletRepository.findOne({
        where: {
          userId: withdrawal.userId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found for withdrawal.');
      }

      const totalDebit =
        toNumber(withdrawal.amount) + toNumber(withdrawal.feeAmount);
      if (toNumber(wallet.balance) < totalDebit) {
        throw new BadRequestException(
          'Wallet balance is not enough for withdrawal approval.',
        );
      }

      wallet.balance = String(toNumber(wallet.balance) - totalDebit);
      wallet.totalSpent = String(toNumber(wallet.totalSpent) + totalDebit);
      await walletRepository.save(wallet);

      withdrawal.status = 'completed';
      withdrawal.approvedBy = adminId;
      withdrawal.completedAt = new Date();
      await withdrawalRepository.save(withdrawal);

      await transactionRepository.save(
        transactionRepository.create({
          senderId: withdrawal.userId,
          receiverId: null,
          amount: withdrawal.amount,
          type: 'withdrawal',
          status: 'completed',
          referenceId: withdrawal.id,
          referenceType: 'withdrawal',
        }),
      );

      if (toNumber(withdrawal.feeAmount) > 0) {
        const systemWallet = await this.walletService.ensurePlatformSystemWallet(
          manager,
        );
        systemWallet.balance = String(
          toNumber(systemWallet.balance) + toNumber(withdrawal.feeAmount),
        );
        systemWallet.totalEarned = String(
          toNumber(systemWallet.totalEarned) + toNumber(withdrawal.feeAmount),
        );
        await walletRepository.save(systemWallet);

        await transactionRepository.save(
          transactionRepository.create({
            senderId: withdrawal.userId,
            receiverId: systemWallet.userId,
            amount: withdrawal.feeAmount,
            type: 'withdrawal_fee',
            status: 'completed',
            referenceId: withdrawal.id,
            referenceType: 'withdrawal',
          }),
        );
      }

      return withdrawal;
    });
  }

  async rejectWithdrawal(withdrawalId: string, adminId: string) {
    const withdrawal = await this.withdrawalsRepository.findOne({
      where: {
        id: withdrawalId,
      },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found.');
    }

    if (withdrawal.status !== 'pending') {
      throw new BadRequestException(
        `Withdrawal has already been ${withdrawal.status}.`,
      );
    }

    withdrawal.status = 'rejected';
    withdrawal.approvedBy = adminId;
    withdrawal.completedAt = new Date();
    return this.withdrawalsRepository.save(withdrawal);
  }

  async listUsers() {
    const [items, wallets] = await Promise.all([
      this.usersRepository.find({
        order: {
          createdAt: 'DESC',
        },
        take: 200,
      }),
      this.walletsRepository.find(),
    ]);

    const walletMap = new Map(wallets.map((wallet) => [wallet.userId, wallet]));

    return {
      items: items.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        isBanned: Boolean(user.bannedAt),
        bannedAt: user.bannedAt,
        banReason: user.banReason,
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        bankHolder: user.bankHolder,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        wallet: walletMap.has(user.id)
          ? {
              balance: toNumber(walletMap.get(user.id)?.balance),
              totalEarned: toNumber(walletMap.get(user.id)?.totalEarned),
              totalSpent: toNumber(walletMap.get(user.id)?.totalSpent),
            }
          : null,
      })),
    };
  }

  async banUser(userId: string, adminId: string, reason?: string) {
    if (userId === adminId) {
      throw new BadRequestException('You cannot ban your own account.');
    }

    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.bannedAt = new Date();
    user.bannedBy = adminId;
    user.banReason = reason?.trim() || null;
    await this.usersRepository.save(user);

    return {
      userId,
      adminId,
      banned: true,
      bannedAt: user.bannedAt,
      reason: user.banReason,
    };
  }

  async unbanUser(userId: string, adminId: string) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.bannedAt = null;
    user.bannedBy = null;
    user.banReason = null;
    await this.usersRepository.save(user);

    return {
      userId,
      adminId,
      banned: false,
      bannedAt: null,
      reason: null,
    };
  }

  private serializeAdminUser(user?: UserEntity | null) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }

  private queuePostEmbedding(postId: string) {
    void this.jobQueueService.enqueuePostEmbedding(postId).catch((error) => {
      this.logger.warn(
        `Unable to enqueue post embedding job for admin-approved post ${postId}.`,
        error instanceof Error ? error.message : undefined,
      );
    });
  }
}
