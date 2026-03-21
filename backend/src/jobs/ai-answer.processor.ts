import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { AiService } from '../modules/ai/ai.service';
import { QuestionsService } from '../modules/questions/questions.service';
import { JobQueueService } from './job-queue.service';
import { AiAnswerJobData, JOB_NAMES, JOB_QUEUE_NAMES } from './job.constants';

@Injectable()
export class AiAnswerProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiAnswerProcessor.name);
  private worker: Worker<AiAnswerJobData> | null = null;

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly aiService: AiService,
    private readonly questionsService: QuestionsService,
  ) {}

  onModuleInit() {
    this.worker = this.jobQueueService.createWorker<AiAnswerJobData>(
      JOB_QUEUE_NAMES.aiAnswer,
      async (job) => {
        if (job.name !== JOB_NAMES.answerAiQuestion) {
          return null;
        }

        try {
          const answeredQuestion = await this.aiService.answerQuestion(
            job.data.questionId,
            job.data.postId,
            job.data.content,
            job.data.authorId,
          );

          await this.jobQueueService.enqueueNotification({
            type: 'question_answered',
            recipientId: job.data.askerId,
            payload: {
              questionId: answeredQuestion.id,
              target: 'ai',
              postId: answeredQuestion.postId,
            },
          });

          return {
            questionId: answeredQuestion.id,
            status: answeredQuestion.status,
          };
        } catch (error) {
          this.logger.error(
            `AI answer job failed for question ${job.data.questionId}.`,
            error instanceof Error ? error.message : undefined,
          );

          await this.questionsService.refundQuestionById(
            job.data.questionId,
            'ai_answer_failed',
          );

          await this.jobQueueService.enqueueNotification({
            type: 'question_refunded',
            recipientId: job.data.askerId,
            payload: {
              questionId: job.data.questionId,
              reason: 'ai_answer_failed',
            },
          });

          return {
            questionId: job.data.questionId,
            status: 'refunded',
          };
        }
      },
      {
        concurrency: 2,
      },
    );
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}
