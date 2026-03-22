import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { DepositEntity } from '../wallet/entities/deposit.entity';
import { TransactionEntity } from '../wallet/entities/transaction.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MomoProvider } from './providers/momo.provider';
import { DepositCodeService } from './services/deposit-code.service';
import { MomoQrService } from './services/momo-qr.service';
import { VnpayProvider } from './providers/vnpay.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DepositEntity,
      WalletEntity,
      TransactionEntity,
      UserEntity,
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    VnpayProvider,
    MomoProvider,
    MomoQrService,
    DepositCodeService,
  ],
  exports: [PaymentService, VnpayProvider, MomoProvider, MomoQrService],
})
export class PaymentModule {}
