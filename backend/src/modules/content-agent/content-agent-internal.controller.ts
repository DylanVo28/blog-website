import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ContentAgentInternalGuard } from './guards/content-agent-internal.guard';
import { ContentAgentService } from './content-agent.service';

@Controller('internal/content-agent')
@UseGuards(ContentAgentInternalGuard)
export class ContentAgentInternalController {
  constructor(private readonly contentAgentService: ContentAgentService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  triggerScheduledRuns() {
    return this.contentAgentService.triggerScheduledRuns();
  }

  @Post('runs/:id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  retryRun(@Param('id') runId: string) {
    return this.contentAgentService.retryRun(runId);
  }
}
