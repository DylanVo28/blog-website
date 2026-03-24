import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PostsModule } from './modules/posts/posts.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AppController } from './app.controller';
import { aiConfig } from './config/ai.config';
import { buildTypeOrmOptions, databaseConfig } from './config/database.config';
import { AiAnswerProcessor } from './jobs/ai-answer.processor';
import { jwtConfig } from './config/jwt.config';
import { mailConfig } from './config/mail.config';
import { JobsModule } from './jobs/jobs.module';
import { paymentConfig } from './config/payment.config';
import { PaymentProcessor } from './jobs/payment.processor';
import { redisConfig } from './config/redis.config';
import { socialAuthConfig } from './config/social-auth.config';
import { EmbeddingProcessor } from './jobs/embedding.processor';
import { NotificationProcessor } from './jobs/notification.processor';
import { RefundProcessor } from './jobs/refund.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        databaseConfig,
        redisConfig,
        jwtConfig,
        paymentConfig,
        aiConfig,
        mailConfig,
        socialAuthConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => buildTypeOrmOptions(),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    JobsModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    NotificationsModule,
    QuestionsModule,
    WalletModule,
    PaymentModule,
    AiModule,
    UploadModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    RefundProcessor,
    EmbeddingProcessor,
    AiAnswerProcessor,
    NotificationProcessor,
    PaymentProcessor,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
