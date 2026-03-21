import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DEFAULT_QUESTION_FEE } from '../../common/constants';
import { toNumber } from '../../common/utils/number.util';
import { AiService } from '../ai/ai.service';
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
    private readonly aiService: AiService,
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

    const fee = dto.fee ?? DEFAULT_QUESTION_FEE;

    const question = await this.dataSource.transaction(async (manager) => {
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

      const receiverWallet =
        dto.target === 'ai'
          ? await this.walletService.ensurePlatformSystemWallet(manager)
          : await this.walletService.ensureWalletForUser(post.authorId, manager);

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
      lockedReceiverWallet.totalEarned = String(
        toNumber(lockedReceiverWallet.totalEarned) + fee,
      );

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
          status: 'completed',
          referenceType: 'question',
          metadata: {
            postId,
            target: dto.target,
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
        const aiResult = await this.aiService.ask({
          question: dto.content,
          postId,
          authorId: post.authorId,
        });

        await this.questionsRepository.update(question.id, {
          answer: aiResult.answer,
          status: 'answered',
          answeredAt: new Date(),
        });

        return this.findQuestionOrFail(question.id);
      } catch (error) {
        this.logger.error(
          `AI auto-answer failed for question ${question.id}`,
          error instanceof Error ? error.message : undefined,
        );
      }
    }

    return this.findQuestionOrFail(question.id);
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
    const question = await this.findQuestionOrFail(questionId);
    const post = await this.postsRepository.findOne({
      where: {
        id: question.postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found for question.');
    }

    if (post.authorId !== answeredBy) {
      throw new ForbiddenException('Only the post author can answer this question.');
    }

    question.answer = dto.answer;
    question.answeredBy = answeredBy;
    question.answeredAt = new Date();
    question.status = 'answered';

    return this.questionsRepository.save(question);
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
}
