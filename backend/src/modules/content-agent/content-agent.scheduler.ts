import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ContentAgentService } from './content-agent.service';

@Injectable()
export class ContentAgentScheduler {
  private readonly logger = new Logger(ContentAgentScheduler.name);

  constructor(private readonly contentAgentService: ContentAgentService) {}

  @Cron('0 * * * * *')
  async scheduleDueRuns() {
    try {
      await this.contentAgentService.scheduleDueRuns();
    } catch (error) {
      this.logger.error(
        'Unable to schedule due content agent runs.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
