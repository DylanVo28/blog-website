import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { CategoryEntity } from '../posts/entities/category.entity';
import { PostEntity } from '../posts/entities/post.entity';
import { PostTagEntity } from '../posts/entities/post-tag.entity';
import { TagEntity } from '../posts/entities/tag.entity';
import { PostsModule } from '../posts/posts.module';
import { UploadModule } from '../upload/upload.module';
import { UserEntity } from '../users/entities/user.entity';
import { ContentAgentInternalController } from './content-agent-internal.controller';
import { ContentAgentController } from './content-agent.controller';
import { ContentAgentInternalGuard } from './guards/content-agent-internal.guard';
import { ContentAgentProcessor } from './content-agent.processor';
import { ContentAgentScheduler } from './content-agent.scheduler';
import { ContentAgentService } from './content-agent.service';
import { ContentAgentConfigEntity } from './entities/content-agent-config.entity';
import { ContentAgentResearchItemEntity } from './entities/content-agent-research-item.entity';
import { ContentAgentRunEntity } from './entities/content-agent-run.entity';

@Module({
  imports: [
    ConfigModule,
    AiModule,
    PostsModule,
    UploadModule,
    TypeOrmModule.forFeature([
      ContentAgentConfigEntity,
      ContentAgentRunEntity,
      ContentAgentResearchItemEntity,
      UserEntity,
      PostEntity,
      CategoryEntity,
      TagEntity,
      PostTagEntity,
    ]),
  ],
  controllers: [ContentAgentController, ContentAgentInternalController],
  providers: [
    ContentAgentService,
    ContentAgentScheduler,
    ContentAgentProcessor,
    ContentAgentInternalGuard,
  ],
})
export class ContentAgentModule {}
