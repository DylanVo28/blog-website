import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { JobQueueService } from './job-queue.service';
import { JOB_NAMES, JOB_QUEUE_NAMES, NotificationJobData } from './job.constants';

@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationProcessor.name);
  private worker: Worker<NotificationJobData> | null = null;

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.worker = this.jobQueueService.createWorker<NotificationJobData>(
      JOB_QUEUE_NAMES.notification,
      async (job) => {
        if (job.name !== JOB_NAMES.sendNotification) {
          this.logger.warn(`Unsupported notification job: ${job.name}`);
          return null;
        }

        return this.sendNotification(job.data);
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

  async sendNotification(data: NotificationJobData) {
    this.logger.log(
      `Dispatching notification: ${data.type} -> ${data.recipientId}`,
    );

    return this.notificationsService.dispatch(data);
  }
}
