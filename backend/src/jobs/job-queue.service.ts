import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, JobsOptions, Processor, Queue, Worker } from 'bullmq';
import { REDIS_DEFAULTS } from '../common/constants';
import {
  AiAnswerJobData,
  ExpireDepositJobData,
  IndexAuthorDocumentEmbeddingsJobData,
  IndexPostEmbeddingsJobData,
  JOB_NAMES,
  JOB_QUEUE_NAMES,
  NotificationJobData,
  PaymentCallbackJobData,
  RefundSweepJobData,
} from './job.constants';

interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: Record<string, never>;
  maxRetriesPerRequest: null;
}

@Injectable()
export class JobQueueService implements OnModuleDestroy {
  private readonly connection: RedisConnectionOptions =
    this.createRedisConnection();

  private readonly embeddingQueue = new Queue(JOB_QUEUE_NAMES.embedding, {
    connection: this.connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  private readonly aiAnswerQueue = new Queue(JOB_QUEUE_NAMES.aiAnswer, {
    connection: this.connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  private readonly refundQueue = new Queue(JOB_QUEUE_NAMES.refund, {
    connection: this.connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  private readonly notificationQueue = new Queue(JOB_QUEUE_NAMES.notification, {
    connection: this.connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  private readonly paymentQueue = new Queue(JOB_QUEUE_NAMES.payment, {
    connection: this.connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  constructor(private readonly configService: ConfigService) {}

  private createRedisConnection(): RedisConnectionOptions {
    const host =
      this.configService.get<string>('redis.host') ?? REDIS_DEFAULTS.host;
    const port =
      this.configService.get<number>('redis.port') ?? REDIS_DEFAULTS.port;
    const username = this.configService.get<string>('redis.username')?.trim();
    const password = this.configService.get<string>('redis.password')?.trim();
    const tls = this.configService.get<Record<string, never> | undefined>(
      'redis.tls',
    );

    return {
      host,
      port,
      username: username || undefined,
      password: password || undefined,
      tls,
      maxRetriesPerRequest: null,
    };
  }

  createWorker<TData = unknown, TResult = unknown>(
    queueName: string,
    processor: Processor<TData, TResult, string>,
    options?: {
      concurrency?: number;
    },
  ) {
    return new Worker<TData, TResult, string>(queueName, processor, {
      connection: this.connection,
      concurrency: options?.concurrency ?? 1,
    });
  }

  async enqueuePostEmbedding(postId: string) {
    return this.embeddingQueue.add(
      JOB_NAMES.indexPostEmbeddings,
      {
        postId,
      } satisfies IndexPostEmbeddingsJobData,
      this.buildJobOptions({
        attempts: 3,
        priority: 10,
      }),
    );
  }

  async enqueueAuthorDocumentEmbedding(documentId: string) {
    return this.embeddingQueue.add(
      JOB_NAMES.indexAuthorDocumentEmbeddings,
      {
        documentId,
      } satisfies IndexAuthorDocumentEmbeddingsJobData,
      this.buildJobOptions({
        attempts: 3,
        priority: 10,
      }),
    );
  }

  async enqueueAiAnswer(data: AiAnswerJobData) {
    return this.aiAnswerQueue.add(
      JOB_NAMES.answerAiQuestion,
      data,
      this.buildJobOptions({
        attempts: 1,
        priority: 2,
      }),
    );
  }

  async enqueueRefundSweep(triggeredBy: RefundSweepJobData['triggeredBy']) {
    return this.refundQueue.add(
      JOB_NAMES.refundExpiredAuthorQuestions,
      {
        triggeredBy,
      } satisfies RefundSweepJobData,
      this.buildJobOptions({
        attempts: 3,
        priority: 5,
      }),
    );
  }

  async enqueueNotification(data: NotificationJobData) {
    return this.notificationQueue.add(
      JOB_NAMES.sendNotification,
      data,
      this.buildJobOptions({
        attempts: 2,
        priority: 10,
      }),
    );
  }

  async enqueuePaymentCallback(data: PaymentCallbackJobData) {
    const jobName =
      data.provider === 'vnpay'
        ? JOB_NAMES.processVnpayCallback
        : JOB_NAMES.processMomoCallback;

    return this.paymentQueue.add(
      jobName,
      data,
      this.buildJobOptions({
        attempts: 5,
        priority: 1,
      }),
    );
  }

  async enqueueDepositExpiry(depositId: string, delay: number) {
    return this.paymentQueue.add(
      JOB_NAMES.expireDeposit,
      {
        depositId,
      } satisfies ExpireDepositJobData,
      this.buildJobOptions({
        attempts: 3,
        priority: 4,
        delay,
      }),
    );
  }

  async onModuleDestroy() {
    await Promise.all([
      this.embeddingQueue.close(),
      this.aiAnswerQueue.close(),
      this.refundQueue.close(),
      this.notificationQueue.close(),
      this.paymentQueue.close(),
    ]);
  }

  private buildJobOptions(input: {
    attempts: number;
    priority: number;
    delay?: number;
  }): JobsOptions {
    return {
      attempts: input.attempts,
      priority: input.priority,
      delay: input.delay,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    };
  }
}
