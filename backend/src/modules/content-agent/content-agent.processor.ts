import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { JobQueueService } from '../../jobs/job-queue.service';
import {
  ContentAgentRunJobData,
  JOB_NAMES,
  JOB_QUEUE_NAMES,
} from '../../jobs/job.constants';
import { ContentAgentService } from './content-agent.service';

@Injectable()
export class ContentAgentProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ContentAgentProcessor.name);
  private worker: Worker<ContentAgentRunJobData> | null = null;

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly contentAgentService: ContentAgentService,
  ) {}

  onModuleInit() {
    this.worker = this.jobQueueService.createWorker<ContentAgentRunJobData>(
      JOB_QUEUE_NAMES.contentAgent,
      async (job) => {
        if (job.name !== JOB_NAMES.runScheduledContentAgent) {
          this.logger.warn(`Unsupported content agent job: ${job.name}`);
          return null;
        }

        return this.contentAgentService.executeRun(job.data.runId);
      },
      {
        concurrency: 1,
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
