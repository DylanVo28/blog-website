import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentModule } from '../payment/payment.module';
import { UserEntity } from '../users/entities/user.entity';
import { DepositEntity } from './entities/deposit.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { WithdrawalEntity } from './entities/withdrawal.entity';
import { WalletEntity } from './entities/wallet.entity';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    PaymentModule,
    TypeOrmModule.forFeature([
      UserEntity,
      WalletEntity,
      TransactionEntity,
      DepositEntity,
      WithdrawalEntity,
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService, TypeOrmModule],
})
export class WalletModule {}
