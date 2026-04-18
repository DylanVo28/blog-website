import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListContentAgentRunsDto } from './dto/list-content-agent-runs.dto';
import { UpdateContentAgentConfigDto } from './dto/update-content-agent-config.dto';
import { ContentAgentService } from './content-agent.service';

@Controller('admin/content-agent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ContentAgentController {
  constructor(private readonly contentAgentService: ContentAgentService) {}

  @Get('configs')
  listConfigs() {
    return this.contentAgentService.listConfigs();
  }

  @Patch('configs/:id')
  updateConfig(
    @Param('id') configId: string,
    @Body() dto: UpdateContentAgentConfigDto,
  ) {
    return this.contentAgentService.updateConfig(configId, dto);
  }

  @Post('configs/:id/trigger')
  triggerConfig(@Param('id') configId: string) {
    return this.contentAgentService.triggerRun(configId, 'manual');
  }

  @Get('runs')
  listRuns(@Query() query: ListContentAgentRunsDto) {
    return this.contentAgentService.listRuns(query);
  }

  @Get('runs/:id')
  getRun(@Param('id') runId: string) {
    return this.contentAgentService.getRun(runId);
  }
}
