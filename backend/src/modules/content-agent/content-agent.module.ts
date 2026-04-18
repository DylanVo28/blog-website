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
import { ContentAgentController } from './content-agent.controller';
import { ContentAgentProcessor } from './content-agent.processor';
import { ContentAgentScheduler } from './content-agent.scheduler';
import { ContentAgentService } from './content-agent.service';
import { ContentAgentConfigEntity } from './entities/content-agent-config.entity';
import { ContentAgentResearchItemEntity } from './entities/content-agent-research-item.entity';
import { ContentAgentRunEntity } from './entities/content-agent-run.entity';

@Module({
  imports: [
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
  controllers: [ContentAgentController],
  providers: [
    ContentAgentService,
    ContentAgentScheduler,
    ContentAgentProcessor,
  ],
})
export class ContentAgentModule {}
