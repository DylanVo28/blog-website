import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { JobQueueService } from './job-queue.service';
import { JOB_NAMES, JOB_QUEUE_NAMES, NotificationJobData } from './job.constants';

@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationProcessor.name);
  private worker: Worker<NotificationJobData> | null = null;

  constructor(private readonly jobQueueService: JobQueueService) {}

  onModuleInit() {
    this.worker = this.jobQueueService.createWorker<NotificationJobData>(
      JOB_QUEUE_NAMES.notification,
      async (job) => {
        if (job.name !== JOB_NAMES.sendNotification) {
          this.logger.warn(`Unsupported notification job: ${job.name}`);
          return null;
        }

        return this.sendNotification(
          job.data.type,
          job.data.recipientId,
          job.data.payload,
        );
      },
      {
        concurrency: 5,
      },
    );
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }

  async sendNotification(
    type: string,
    recipientId: string,
    payload?: Record<string, unknown>,
  ) {
    this.logger.log(
      `Notification queued: ${type} -> ${recipientId} ${payload ? JSON.stringify(payload) : ''}`.trim(),
    );

    return {
      type,
      recipientId,
      payload: payload ?? null,
      queued: true,
    };
  }
}
