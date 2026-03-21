import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MomoProvider } from './providers/momo.provider';
import { VnpayProvider } from './providers/vnpay.provider';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, VnpayProvider, MomoProvider],
  exports: [PaymentService, VnpayProvider, MomoProvider],
})
export class PaymentModule {}
