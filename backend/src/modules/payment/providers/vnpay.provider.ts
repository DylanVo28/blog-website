import { Injectable } from '@nestjs/common';

@Injectable()
export class VnpayProvider {
  createPaymentUrl(orderId: string, amount: number) {
    return {
      provider: 'vnpay',
      orderId,
      amount,
      paymentUrl: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?orderId=${orderId}`,
    };
  }

  verifyCallback(payload: Record<string, unknown>) {
    return {
      provider: 'vnpay',
      verified: false,
      payload,
    };
  }
}
