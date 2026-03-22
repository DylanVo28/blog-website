import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

interface MomoQrInput {
  phone: string;
  amount: number;
  comment: string;
}

@Injectable()
export class MomoQrService {
  generateDeepLink(input: MomoQrInput) {
    const params = new URLSearchParams({
      amount: String(input.amount),
      comment: input.comment,
    });

    return `https://me.momo.vn/${input.phone}?${params.toString()}`;
  }

  generateSimpleQrPayload(input: MomoQrInput) {
    return `2|99|${input.phone}|||0|0|${input.amount}|${input.comment}`;
  }

  async generateQrDataUrl(payload: string) {
    return QRCode.toDataURL(payload, {
      type: 'image/png',
      width: 420,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    });
  }
}
