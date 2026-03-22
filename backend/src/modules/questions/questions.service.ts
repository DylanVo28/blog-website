import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DEFAULT_QUESTION_FEE } from '../../common/constants';
import { toNumber } from '../../common/utils/number.util';
import { JobQueueService } from '../../jobs/job-queue.service';
import { PostEntity } from '../posts/entities/post.entity';
import { TransactionEntity } from '../wallet/entities/transaction.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { WalletService } from '../wallet/wallet.service';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionEntity } from './entities/question.entity';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly jobQueueService: JobQueueService,
    private readonly walletService: WalletService,
    @InjectRepository(QuestionEntity)
    private readonly questionsRepository: Repository<QuestionEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
  ) {}

  async create(postId: string, askerId: string, dto: CreateQuestionDto) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (dto.target === 'author' && post.authorId === askerId) {
      throw new BadRequestException(
        'You cannot ask a paid author question on your own post.',
      );
    }

    const fee = dto.fee ?? DEFAULT_QUESTION_FEE;

    const question = await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const senderWallet = await this.walletService.ensureWalletForUser(
        askerId,
        manager,
      );
      const lockedSenderWallet = await manager.getRepository(WalletEntity).findOne({
        where: {
          id: senderWallet.id,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!lockedSenderWallet) {
        throw new NotFoundException('Sender wallet not found.');
      }

      if (toNumber(lockedSenderWallet.balance) < fee) {
        throw new BadRequestException('Insufficient wallet balance.');
      }

      // Hold all question fees in the platform wallet first.
      // AI questions become revenue immediately, while author questions are settled later
      // only after the author actually answers.
      const receiverWallet = await this.walletService.ensurePlatformSystemWallet(
        manager,
      );

      const lockedReceiverWallet = await manager.getRepository(WalletEntity).findOne({
        where: {
          id: receiverWallet.id,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!lockedReceiverWallet) {
        throw new NotFoundException('Receiver wallet not found.');
      }

      lockedSenderWallet.balance = String(toNumber(lockedSenderWallet.balance) - fee);
      lockedSenderWallet.totalSpent = String(
        toNumber(lockedSenderWallet.totalSpent) + fee,
      );

      lockedReceiverWallet.balance = String(
        toNumber(lockedReceiverWallet.balance) + fee,
      );
      if (dto.target === 'ai') {
        lockedReceiverWallet.totalEarned = String(
          toNumber(lockedReceiverWallet.totalEarned) + fee,
        );
      }

      await manager.save(WalletEntity, lockedSenderWallet);
      await manager.save(WalletEntity, lockedReceiverWallet);

      const transaction = await manager.save(
        TransactionEntity,
        manager.create(TransactionEntity, {
          senderId: askerId,
          receiverId: lockedReceiverWallet.userId,
          amount: String(fee),
          type:
            dto.target === 'ai' ? 'question_to_ai' : 'question_to_author',
          status: dto.target === 'ai' ? 'completed' : 'pending',
          referenceType: 'question',
          metadata: {
            postId,
            target: dto.target,
            escrowedForAuthorId:
              dto.target === 'author' ? post.authorId : undefined,
          },
        }),
      );

      const createdQuestion = await manager.save(
        QuestionEntity,
        manager.create(QuestionEntity, {
          postId,
          askerId,
          target: dto.target,
          content: dto.content,
          fee: String(fee),
          transactionId: transaction.id,
          status: 'pending',
          isHighlighted: true,
          deadlineAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }),
      );

      transaction.referenceId = createdQuestion.id;
      await manager.save(TransactionEntity, transaction);

      return createdQuestion;
    });

    if (dto.target === 'ai') {
      try {
        await this.jobQueueService.enqueueAiAnswer({
          questionId: question.id,
          postId,
          content: dto.content,
          authorId: post.authorId,
          askerId,
        });

        return this.findQuestionOrFail(question.id);
      } catch (error) {
        this.logger.error(
          `AI answer job enqueue failed for question ${question.id}`,
          error instanceof Error ? error.message : undefined,
        );

        try {
          await this.refundQuestionById(question.id, 'ai_answer_failed');
          return this.findQuestionOrFail(question.id);
        } catch (refundError) {
          this.logger.error(
            `Refund after AI failure also failed for question ${question.id}`,
            refundError instanceof Error ? refundError.message : undefined,
          );
        }
      }
    }

    if (dto.target === 'author' && post.authorId !== askerId) {
      void this.jobQueueService.enqueueNotification({
        type: 'question_created',
        recipientId: post.authorId,
        payload: {
          questionId: question.id,
          postId,
          target: dto.target,
        },
      }).catch((error) => {
        this.logger.warn(
          `Unable to enqueue question_created notification for question ${question.id}.`,
          error instanceof Error ? error.message : undefined,
        );
      });
    }

    return this.findQuestionOrFail(question.id);
  }

  async processExpiredAuthorQuestions(limit = 100) {
    let processed = 0;

    while (processed < limit) {
      try {
        const refundedQuestionId = await this.dataSource.transaction(
          'SERIALIZABLE',
          async (manager) => {
            const [expiredQuestion] = await manager.query(
              `
                SELECT q.id
                FROM questions q
                WHERE q.status = 'pending'
                  AND q.target = 'author'
                  AND q.deadline_at IS NOT NULL
                  AND q.deadline_at < NOW()
                ORDER BY q.deadline_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
              `,
            );

            if (!expiredQuestion?.id) {
              return null;
            }

            const refunded = await this.refundQuestionInManager(
              manager,
              expiredQuestion.id,
              'author_timeout',
            );

            return refunded ? expiredQuestion.id : null;
          },
        );

        if (!refundedQuestionId) {
          break;
        }

        processed += 1;
      } catch (error) {
        this.logger.error(
          'Failed to process expired author question refunds.',
          error instanceof Error ? error.message : undefined,
        );
        break;
      }
    }

    return {
      processed,
    };
  }

  async refundQuestionById(questionId: string, reason: string) {
    const refunded = await this.dataSource.transaction(
      'SERIALIZABLE',
      async (manager) =>
        this.refundQuestionInManager(manager, questionId, reason),
    );

    return {
      refunded,
      question: await this.findQuestionOrFail(questionId),
    };
  }

  async listByPost(postId: string) {
    const items = await this.questionsRepository.find({
      where: {
        postId,
      },
      order: {
        isHighlighted: 'DESC',
        createdAt: 'DESC',
      },
    });

    return {
      postId,
      items,
    };
  }

  async answer(questionId: string, answeredBy: string, dto: AnswerQuestionDto) {
    const savedQuestion = await this.dataSource.transaction(
      'SERIALIZABLE',
      async (manager) => {
        const questionsRepository = manager.getRepository(QuestionEntity);
        const postsRepository = manager.getRepository(PostEntity);
        const transactionsRepository = manager.getRepository(TransactionEntity);
        const walletsRepository = manager.getRepository(WalletEntity);

        const question = await questionsRepository.findOne({
          where: {
            id: questionId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!question) {
          throw new NotFoundException('Question not found.');
        }

        if (question.target !== 'author') {
          throw new BadRequestException(
            'Only author-targeted questions can be answered manually.',
          );
        }

        if (question.status !== 'pending') {
          throw new BadRequestException('Only pending questions can be answered.');
        }

        if (question.deadlineAt && question.deadlineAt.getTime() < Date.now()) {
          throw new BadRequestException(
            'This question has expired and will be refunded automatically.',
          );
        }

        const post = await postsRepository.findOne({
          where: {
            id: question.postId,
          },
        });

        if (!post) {
          throw new NotFoundException('Post not found for question.');
        }

        if (post.authorId !== answeredBy) {
          throw new ForbiddenException(
            'Only the post author can answer this question.',
          );
        }

        if (!question.transactionId) {
          throw new NotFoundException(
            'Question charge transaction was not found.',
          );
        }

        const chargeTransaction = await transactionsRepository.findOne({
          where: {
            id: question.transactionId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!chargeTransaction) {
          throw new NotFoundException('Charge transaction not found.');
        }

        if (chargeTransaction.status === 'refunded') {
          throw new BadRequestException('This question has already been refunded.');
        }

        const now = new Date();

        if (chargeTransaction.status === 'pending') {
          if (!chargeTransaction.receiverId) {
            throw new BadRequestException('Escrow source user is missing.');
          }

          const escrowWallet = await this.walletService.ensureWalletForUser(
            chargeTransaction.receiverId,
            manager,
          );
          const lockedEscrowWallet = await walletsRepository.findOne({
            where: {
              id: escrowWallet.id,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          });

          const authorWallet = await this.walletService.ensureWalletForUser(
            answeredBy,
            manager,
          );
          const lockedAuthorWallet = await walletsRepository.findOne({
            where: {
              id: authorWallet.id,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          });

          if (!lockedEscrowWallet || !lockedAuthorWallet) {
            throw new NotFoundException(
              'Unable to lock escrow or author wallet for settlement.',
            );
          }

          const payoutAmount = toNumber(question.fee);
          if (toNumber(lockedEscrowWallet.balance) < payoutAmount) {
            throw new BadRequestException(
              'Escrow wallet balance is insufficient for author payout.',
            );
          }

          lockedEscrowWallet.balance = String(
            toNumber(lockedEscrowWallet.balance) - payoutAmount,
          );
          lockedAuthorWallet.balance = String(
            toNumber(lockedAuthorWallet.balance) + payoutAmount,
          );
          lockedAuthorWallet.totalEarned = String(
            toNumber(lockedAuthorWallet.totalEarned) + payoutAmount,
          );

          await walletsRepository.save(lockedEscrowWallet);
          await walletsRepository.save(lockedAuthorWallet);

          chargeTransaction.status = 'completed';
          chargeTransaction.metadata = {
            ...(chargeTransaction.metadata ?? {}),
            settledAt: now.toISOString(),
            settledToAuthorId: answeredBy,
          };
          await transactionsRepository.save(chargeTransaction);

          await transactionsRepository.save(
            transactionsRepository.create({
              senderId: chargeTransaction.receiverId,
              receiverId: answeredBy,
              amount: question.fee,
              type: 'bonus',
              status: 'completed',
              referenceId: question.id,
              referenceType: 'question',
              metadata: {
                source: 'author_question_payout',
                originalTransactionId: chargeTransaction.id,
              },
            }),
          );
        }

        question.answer = dto.answer;
        question.answeredBy = answeredBy;
        question.answeredAt = now;
        question.status = 'answered';

        return questionsRepository.save(question);
      },
    );

    if (savedQuestion.askerId !== answeredBy) {
      void this.jobQueueService.enqueueNotification({
        type: 'question_answered',
        recipientId: savedQuestion.askerId,
        payload: {
          questionId: savedQuestion.id,
          target: savedQuestion.target,
          postId: savedQuestion.postId,
          answeredBy,
        },
      }).catch((error) => {
        this.logger.warn(
          `Unable to enqueue question_answered notification for question ${savedQuestion.id}.`,
          error instanceof Error ? error.message : undefined,
        );
      });
    }

    return savedQuestion;
  }

  async listMyQuestions(userId: string) {
    const items = await this.questionsRepository.find({
      where: {
        askerId: userId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      userId,
      items,
    };
  }

  async listPendingForAuthor(authorId: string) {
    const items = await this.questionsRepository
      .createQueryBuilder('question')
      .innerJoin(PostEntity, 'post', 'post.id = question.post_id')
      .where('post.author_id = :authorId', {
        authorId,
      })
      .andWhere('question.status = :status', {
        status: 'pending',
      })
      .andWhere('question.target = :target', {
        target: 'author',
      })
      .andWhere('(question.deadline_at IS NULL OR question.deadline_at > NOW())')
      .orderBy('question.created_at', 'ASC')
      .getMany();

    return {
      authorId,
      items,
    };
  }

  private async findQuestionOrFail(questionId: string): Promise<QuestionEntity> {
    const question = await this.questionsRepository.findOne({
      where: {
        id: questionId,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found.');
    }

    return question;
  }

  private async refundQuestionInManager(
    manager: EntityManager,
    questionId: string,
    reason: string,
  ): Promise<boolean> {
    const questionsRepository = manager.getRepository(QuestionEntity);
    const transactionsRepository = manager.getRepository(TransactionEntity);
    const walletsRepository = manager.getRepository(WalletEntity);

    const question = await questionsRepository.findOne({
      where: {
        id: questionId,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found for refund.');
    }

    if (question.status !== 'pending') {
      return false;
    }

    if (!question.transactionId) {
      throw new NotFoundException('Question charge transaction was not found.');
    }

    const chargeTransaction = await transactionsRepository.findOne({
      where: {
        id: question.transactionId,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!chargeTransaction) {
      throw new NotFoundException('Charge transaction not found.');
    }

    if (chargeTransaction.status === 'refunded') {
      question.status = 'refunded';
      await questionsRepository.save(question);
      return false;
    }

    if (!chargeTransaction.receiverId) {
      throw new BadRequestException('Refund source user is missing.');
    }

    const refundAmount = toNumber(question.fee);
    const refundReceiverId = chargeTransaction.senderId ?? question.askerId;
    const refundSourceId = chargeTransaction.receiverId;

    const refundReceiverWallet = await this.walletService.ensureWalletForUser(
      refundReceiverId,
      manager,
    );
    const lockedRefundReceiverWallet = await walletsRepository.findOne({
      where: {
        id: refundReceiverWallet.id,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    const refundSourceWallet = await this.walletService.ensureWalletForUser(
      refundSourceId,
      manager,
    );
    const lockedRefundSourceWallet = await walletsRepository.findOne({
      where: {
        id: refundSourceWallet.id,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!lockedRefundReceiverWallet || !lockedRefundSourceWallet) {
      throw new NotFoundException('Refund wallets could not be locked.');
    }

    if (toNumber(lockedRefundSourceWallet.balance) < refundAmount) {
      throw new BadRequestException(
        'Refund source wallet balance is insufficient.',
      );
    }

    lockedRefundSourceWallet.balance = String(
      toNumber(lockedRefundSourceWallet.balance) - refundAmount,
    );
    lockedRefundSourceWallet.totalEarned = String(
      Math.max(0, toNumber(lockedRefundSourceWallet.totalEarned) - refundAmount),
    );

    lockedRefundReceiverWallet.balance = String(
      toNumber(lockedRefundReceiverWallet.balance) + refundAmount,
    );
    lockedRefundReceiverWallet.totalSpent = String(
      Math.max(0, toNumber(lockedRefundReceiverWallet.totalSpent) - refundAmount),
    );

    await walletsRepository.save(lockedRefundSourceWallet);
    await walletsRepository.save(lockedRefundReceiverWallet);

    chargeTransaction.status = 'refunded';
    chargeTransaction.metadata = {
      ...(chargeTransaction.metadata ?? {}),
      refundReason: reason,
      refundedAt: new Date().toISOString(),
    };
    await transactionsRepository.save(chargeTransaction);

    const refundTransaction = transactionsRepository.create({
      senderId: refundSourceId,
      receiverId: refundReceiverId,
      amount: question.fee,
      type: 'refund',
      status: 'completed',
      referenceId: question.id,
      referenceType: 'question',
      metadata: {
        reason,
        originalTransactionId: chargeTransaction.id,
        originalTransactionType: chargeTransaction.type,
      },
    });
    await transactionsRepository.save(refundTransaction);

    question.status = 'refunded';
    await questionsRepository.save(question);

    return true;
  }
}
