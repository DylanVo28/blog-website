import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { QuestionEntity } from '../questions/entities/question.entity';
import { UserEntity } from '../users/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionEntity } from '../wallet/entities/transaction.entity';
import { WithdrawalEntity } from '../wallet/entities/withdrawal.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    WalletModule,
    TypeOrmModule.forFeature([
      UserEntity,
      PostEntity,
      QuestionEntity,
      WalletEntity,
      TransactionEntity,
      WithdrawalEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
