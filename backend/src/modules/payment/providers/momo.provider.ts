import { Injectable } from '@nestjs/common';

@Injectable()
export class MomoProvider {
  createPaymentUrl(orderId: string, amount: number) {
    return {
      provider: 'momo',
      orderId,
      amount,
      paymentUrl: `https://test-payment.momo.vn/?orderId=${orderId}`,
    };
  }

  verifyCallback(payload: Record<string, unknown>) {
    return {
      provider: 'momo',
      verified: false,
      payload,
    };
  }
}
