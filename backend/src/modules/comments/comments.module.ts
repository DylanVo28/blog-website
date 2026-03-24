import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppThrottlerGuard } from '../../common/guards/app-throttler.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostEntity } from '../posts/entities/post.entity';
import { CommentEntity } from './entities/comment.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([CommentEntity, PostEntity]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService, AppThrottlerGuard],
  exports: [CommentsService, TypeOrmModule],
})
export class CommentsModule {}
