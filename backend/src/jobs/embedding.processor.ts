import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { AiService } from '../modules/ai/ai.service';
import { JobQueueService } from './job-queue.service';
import {
  IndexAuthorDocumentEmbeddingsJobData,
  IndexPostEmbeddingsJobData,
  JOB_NAMES,
  JOB_QUEUE_NAMES,
} from './job.constants';

@Injectable()
export class EmbeddingProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingProcessor.name);
  private worker:
    | Worker<IndexPostEmbeddingsJobData | IndexAuthorDocumentEmbeddingsJobData>
    | null = null;

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly aiService: AiService,
  ) {}

  onModuleInit() {
    this.worker = this.jobQueueService.createWorker<
      IndexPostEmbeddingsJobData | IndexAuthorDocumentEmbeddingsJobData
    >(
      JOB_QUEUE_NAMES.embedding,
      async (job) => {
        switch (job.name) {
          case JOB_NAMES.indexPostEmbeddings:
            return this.processPostEmbeddings(
              (job.data as IndexPostEmbeddingsJobData).postId,
            );
          case JOB_NAMES.indexAuthorDocumentEmbeddings:
            return this.processAuthorDocumentEmbeddings(
              (job.data as IndexAuthorDocumentEmbeddingsJobData).documentId,
            );
          default:
            this.logger.warn(`Unsupported embedding job: ${job.name}`);
            return null;
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

  async processPostEmbeddings(postId: string) {
    const result = await this.aiService.indexPost(postId);

    this.logger.log(
      `Indexed ${result.chunkCount} post embedding chunk(s) for post ${postId}.`,
    );

    return {
      postId,
      processed: true,
      chunkCount: result.chunkCount,
    };
  }

  async processAuthorDocumentEmbeddings(documentId: string) {
    const result = await this.aiService.indexAuthorDocument(documentId);

    this.logger.log(
      `Indexed ${result.chunkCount} author document chunk(s) for document ${documentId}.`,
    );

    return {
      documentId,
      processed: true,
      chunkCount: result.chunkCount,
    };
  }
}
