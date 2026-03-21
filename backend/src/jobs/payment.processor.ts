import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { PaymentService } from '../modules/payment/payment.service';
import { JobQueueService } from './job-queue.service';
import {
  JOB_NAMES,
  JOB_QUEUE_NAMES,
  PaymentCallbackJobData,
} from './job.constants';

@Injectable()
export class PaymentProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentProcessor.name);
  private worker: Worker<PaymentCallbackJobData> | null = null;

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly paymentService: PaymentService,
  ) {}

  onModuleInit() {
    this.worker = this.jobQueueService.createWorker<PaymentCallbackJobData>(
      JOB_QUEUE_NAMES.payment,
      async (job) => {
        switch (job.name) {
          case JOB_NAMES.processVnpayCallback:
            return this.paymentService.processQueuedCallback(
              'vnpay',
              job.data.callback,
            );
          case JOB_NAMES.processMomoCallback:
            return this.paymentService.processQueuedCallback(
              'momo',
              job.data.callback,
            );
          default:
            this.logger.warn(`Unsupported payment job: ${job.name}`);
            return null;
        }
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
}
