import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { QuestionsService } from '../modules/questions/questions.service';
import { JobQueueService } from './job-queue.service';
import { JOB_NAMES, JOB_QUEUE_NAMES, RefundSweepJobData } from './job.constants';

@Injectable()
export class RefundProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RefundProcessor.name);
  private intervalId: NodeJS.Timeout | null = null;
  private worker: Worker<RefundSweepJobData> | null = null;

  constructor(
    private readonly questionsService: QuestionsService,
    private readonly jobQueueService: JobQueueService,
  ) {}

  onModuleInit() {
    this.worker = this.jobQueueService.createWorker<RefundSweepJobData>(
      JOB_QUEUE_NAMES.refund,
      async (job) => {
        if (job.name !== JOB_NAMES.refundExpiredAuthorQuestions) {
          this.logger.warn(`Unsupported refund job: ${job.name}`);
          return null;
        }

        return this.processExpiredQuestions();
      },
    );

    void this.enqueueRefundCycle('startup');
    this.intervalId = setInterval(() => {
      void this.enqueueRefundCycle('interval');
    }, 5 * 60 * 1000);
    this.intervalId.unref?.();
  }

  async onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }

  async processExpiredQuestions() {
    return this.questionsService.processExpiredAuthorQuestions();
  }

  private async enqueueRefundCycle(triggeredBy: RefundSweepJobData['triggeredBy']) {
    try {
      await this.jobQueueService.enqueueRefundSweep(triggeredBy);
    } catch (error) {
      this.logger.error(
        'Refund processor enqueue failed.',
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}
