import {
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, JobsOptions, Processor, Queue, Worker } from 'bullmq';
import { REDIS_DEFAULTS } from '../common/constants';
import {
  AiAnswerJobData,
  ContentAgentRunJobData,
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
  connectTimeout: number;
  enableOfflineQueue?: boolean;
}

@Injectable()
export class JobQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private readonly producerConnection: RedisConnectionOptions =
    this.createRedisConnection({
      failFast: true,
    });
  private readonly workerConnection: RedisConnectionOptions =
    this.createRedisConnection();

  private readonly embeddingQueue = new Queue(JOB_QUEUE_NAMES.embedding, {
    connection: this.producerConnection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  private readonly aiAnswerQueue = new Queue(JOB_QUEUE_NAMES.aiAnswer, {
    connection: this.producerConnection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  private readonly refundQueue = new Queue(JOB_QUEUE_NAMES.refund, {
    connection: this.producerConnection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  private readonly notificationQueue = new Queue(JOB_QUEUE_NAMES.notification, {
    connection: this.producerConnection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  private readonly paymentQueue = new Queue(JOB_QUEUE_NAMES.payment, {
    connection: this.producerConnection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  private readonly contentAgentQueue = new Queue(JOB_QUEUE_NAMES.contentAgent, {
    connection: this.producerConnection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  constructor(private readonly configService: ConfigService) {}

  private createRedisConnection(options?: {
    failFast?: boolean;
  }): RedisConnectionOptions {
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
      connectTimeout: 5000,
      enableOfflineQueue: options?.failFast ? false : undefined,
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
      connection: this.workerConnection,
      concurrency: options?.concurrency ?? 1,
    });
  }

  async enqueuePostEmbedding(postId: string) {
    return this.addJobWithTimeout(
      this.embeddingQueue,
      JOB_NAMES.indexPostEmbeddings,
      {
        postId,
      } satisfies IndexPostEmbeddingsJobData,
      this.buildJobOptions({
        attempts: 3,
        priority: 10,
      }),
      `enqueue embedding job for post ${postId}`,
    );
  }

  async enqueueAuthorDocumentEmbedding(documentId: string) {
    return this.addJobWithTimeout(
      this.embeddingQueue,
      JOB_NAMES.indexAuthorDocumentEmbeddings,
      {
        documentId,
      } satisfies IndexAuthorDocumentEmbeddingsJobData,
      this.buildJobOptions({
        attempts: 3,
        priority: 10,
      }),
      `enqueue author document embedding job for document ${documentId}`,
    );
  }

  async enqueueAiAnswer(data: AiAnswerJobData) {
    return this.addJobWithTimeout(
      this.aiAnswerQueue,
      JOB_NAMES.answerAiQuestion,
      data,
      this.buildJobOptions({
        attempts: 1,
        priority: 2,
      }),
      `enqueue AI answer job for question ${data.questionId}`,
    );
  }

  async enqueueRefundSweep(triggeredBy: RefundSweepJobData['triggeredBy']) {
    return this.addJobWithTimeout(
      this.refundQueue,
      JOB_NAMES.refundExpiredAuthorQuestions,
      {
        triggeredBy,
      } satisfies RefundSweepJobData,
      this.buildJobOptions({
        attempts: 3,
        priority: 5,
      }),
      `enqueue refund sweep job triggered by ${triggeredBy}`,
    );
  }

  async enqueueNotification(data: NotificationJobData) {
    return this.addJobWithTimeout(
      this.notificationQueue,
      JOB_NAMES.sendNotification,
      data,
      this.buildJobOptions({
        attempts: 2,
        priority: 10,
      }),
      `enqueue notification job for recipient ${data.recipientId}`,
    );
  }

  async enqueuePaymentCallback(data: PaymentCallbackJobData) {
    const jobName =
      data.provider === 'vnpay'
        ? JOB_NAMES.processVnpayCallback
        : JOB_NAMES.processMomoCallback;

    return this.addJobWithTimeout(
      this.paymentQueue,
      jobName,
      data,
      this.buildJobOptions({
        attempts: 5,
        priority: 1,
      }),
      `enqueue payment callback job for provider ${data.provider}`,
    );
  }

  async enqueueDepositExpiry(depositId: string, delay: number) {
    return this.addJobWithTimeout(
      this.paymentQueue,
      JOB_NAMES.expireDeposit,
      {
        depositId,
      } satisfies ExpireDepositJobData,
      this.buildJobOptions({
        attempts: 3,
        priority: 4,
        delay,
      }),
      `enqueue deposit expiry job for deposit ${depositId}`,
    );
  }

  async enqueueContentAgentRun(data: ContentAgentRunJobData) {
    return this.addJobWithTimeout(
      this.contentAgentQueue,
      JOB_NAMES.runScheduledContentAgent,
      data,
      this.buildJobOptions({
        attempts: 3,
        priority: data.triggerSource === 'schedule' ? 3 : 1,
        jobId: data.idempotencyKey,
      }),
      `enqueue content agent run ${data.runId}`,
    );
  }

  async onModuleDestroy() {
    await Promise.all([
      this.embeddingQueue.close(),
      this.aiAnswerQueue.close(),
      this.refundQueue.close(),
      this.notificationQueue.close(),
      this.paymentQueue.close(),
      this.contentAgentQueue.close(),
    ]);
  }

  private buildJobOptions(input: {
    attempts: number;
    priority: number;
    delay?: number;
    jobId?: string;
  }): JobsOptions {
    return {
      attempts: input.attempts,
      priority: input.priority,
      delay: input.delay,
      jobId: input.jobId ? this.toSafeJobId(input.jobId) : undefined,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    };
  }

  private toSafeJobId(value: string) {
    return value.replace(/:/g, '__');
  }

  private async addJobWithTimeout<TData>(
    queue: Queue<TData>,
    jobName: string,
    data: TData,
    options: JobsOptions,
    actionDescription: string,
  ) {
    const timeoutMs = 5000;

    try {
      return await Promise.race([
        (queue as Queue<any, any, string>).add(jobName, data, options),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            reject(
              new ServiceUnavailableException(
                `Unable to ${actionDescription} because Redis is unavailable or misconfigured.`,
              ),
            );
          }, timeoutMs),
        ),
      ]);
    } catch (error) {
      this.logger.error(
        `Queue add failed for ${actionDescription}.`,
        error instanceof Error ? error.stack ?? error.message : String(error),
      );

      const detail =
        error instanceof Error && error.message
          ? ` Detail: ${error.message}`
          : '';

      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        `Unable to ${actionDescription} because Redis is unavailable or misconfigured.${detail}`,
      );
    }
  }
}
