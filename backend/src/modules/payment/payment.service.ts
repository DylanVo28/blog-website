import { Injectable } from '@nestjs/common';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { MomoProvider } from './providers/momo.provider';
import { VnpayProvider } from './providers/vnpay.provider';

@Injectable()
export class PaymentService {
  constructor(
    private readonly vnpayProvider: VnpayProvider,
    private readonly momoProvider: MomoProvider,
  ) {}

  handleVnpayCallback(dto: PaymentCallbackDto) {
    return this.vnpayProvider.verifyCallback(dto as Record<string, unknown>);
  }

  handleMomoCallback(dto: PaymentCallbackDto) {
    return this.momoProvider.verifyCallback(dto as Record<string, unknown>);
  }

  handleVnpayReturn(query: Record<string, unknown>) {
    return {
      provider: 'vnpay',
      status: 'received',
      query,
    };
  }
}
