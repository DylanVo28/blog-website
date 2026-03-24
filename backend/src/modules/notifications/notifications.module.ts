import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PostEntity } from '../posts/entities/post.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([NotificationEntity, PostEntity, UserEntity]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
