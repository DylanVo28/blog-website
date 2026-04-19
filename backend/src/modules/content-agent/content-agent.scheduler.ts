import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ContentAgentService } from './content-agent.service';

@Injectable()
export class ContentAgentScheduler {
  private readonly logger = new Logger(ContentAgentScheduler.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly contentAgentService: ContentAgentService,
  ) {}

  @Cron('0 * * * * *')
  async scheduleDueRuns() {
    if (!this.isInternalSchedulerEnabled()) {
      return;
    }

    try {
      const result = await this.contentAgentService.scheduleDueRuns();

      if (result.acceptedRuns > 0) {
        this.logger.log(
          `Enqueued ${result.acceptedRuns} scheduled content agent run(s) at ${result.checkedAt}.`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Unable to schedule due content agent runs.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private isInternalSchedulerEnabled() {
    const configuredValue = this.configService
      .get<string>('CONTENT_AGENT_INTERNAL_SCHEDULER_ENABLED')
      ?.trim()
      .toLowerCase();

    if (!configuredValue) {
      return true;
    }

    return !['0', 'false', 'off', 'no'].includes(configuredValue);
  }
}
