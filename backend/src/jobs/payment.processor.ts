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
  ExpireDepositJobData,
  JOB_NAMES,
  JOB_QUEUE_NAMES,
  PaymentCallbackJobData,
  PaymentJobData,
} from './job.constants';

@Injectable()
export class PaymentProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentProcessor.name);
  private worker: Worker<PaymentJobData> | null = null;

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly paymentService: PaymentService,
  ) {}

  onModuleInit() {
    this.worker = this.jobQueueService.createWorker<PaymentJobData>(
      JOB_QUEUE_NAMES.payment,
      async (job) => {
        switch (job.name) {
          case JOB_NAMES.processVnpayCallback:
            return this.paymentService.processQueuedCallback(
              'vnpay',
              (job.data as PaymentCallbackJobData).callback,
            );
          case JOB_NAMES.processMomoCallback:
            return this.paymentService.processQueuedCallback(
              'momo',
              (job.data as PaymentCallbackJobData).callback,
            );
          case JOB_NAMES.expireDeposit:
            return this.paymentService.expireDeposit(
              (job.data as ExpireDepositJobData).depositId,
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
