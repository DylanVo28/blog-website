import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { CategoryEntity } from './entities/category.entity';
import { PostEntity } from './entities/post.entity';
import { PostTagEntity } from './entities/post-tag.entity';
import { TagEntity } from './entities/tag.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    AiModule,
    TypeOrmModule.forFeature([
      PostEntity,
      CategoryEntity,
      TagEntity,
      PostTagEntity,
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService, TypeOrmModule],
})
export class PostsModule {}
