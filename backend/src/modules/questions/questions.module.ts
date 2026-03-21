import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppThrottlerGuard } from '../../common/guards/app-throttler.guard';
import { AiModule } from '../ai/ai.module';
import { PostEntity } from '../posts/entities/post.entity';
import { UserEntity } from '../users/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionEntity } from '../wallet/entities/transaction.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { QuestionEntity } from './entities/question.entity';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  imports: [
    AiModule,
    WalletModule,
    TypeOrmModule.forFeature([
      QuestionEntity,
      PostEntity,
      UserEntity,
      WalletEntity,
      TransactionEntity,
    ]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, AppThrottlerGuard],
  exports: [QuestionsService, TypeOrmModule],
})
export class QuestionsModule {}
