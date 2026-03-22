import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

interface MomoQrInput {
  phone: string;
  name?: string;
  amount: number;
  comment: string;
}

@Injectable()
export class MomoQrService {
  generateScanPayload(input: MomoQrInput) {
    const receiverName = input.name?.trim() || '';
    return `2|99|${input.phone}|${receiverName}||0|0|${input.amount}||transfer_myqr`;
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
