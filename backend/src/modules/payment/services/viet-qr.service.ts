import { Injectable } from '@nestjs/common';
import { PAYMENT_DEFAULTS } from '../../../common/constants';

interface VietQrInput {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  template?: string;
}

@Injectable()
export class VietQrService {
  private readonly baseUrl = 'https://img.vietqr.io/image';

  generateQrUrl(input: VietQrInput) {
    const url = new URL(
      `${this.baseUrl}/${input.bankCode}-${input.accountNumber}-${input.template ?? PAYMENT_DEFAULTS.vcbQr.template}.png`,
    );

    url.searchParams.set('amount', String(input.amount));
    url.searchParams.set('addInfo', input.description);
    url.searchParams.set('accountName', input.accountName);

    return url.toString();
  }
}
