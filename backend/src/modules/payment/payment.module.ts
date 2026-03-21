import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepositEntity } from '../wallet/entities/deposit.entity';
import { TransactionEntity } from '../wallet/entities/transaction.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MomoProvider } from './providers/momo.provider';
import { VnpayProvider } from './providers/vnpay.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([DepositEntity, WalletEntity, TransactionEntity]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, VnpayProvider, MomoProvider],
  exports: [PaymentService, VnpayProvider, MomoProvider],
})
export class PaymentModule {}
