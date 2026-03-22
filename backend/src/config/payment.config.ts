import { registerAs } from '@nestjs/config';

export const paymentConfig = registerAs('payment', () => ({
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE ?? '',
    hashSecret: process.env.VNPAY_HASH_SECRET ?? '',
    returnUrl: process.env.VNPAY_RETURN_URL ?? '',
    ipnUrl: process.env.VNPAY_IPN_URL ?? '',
  },
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE ?? '',
    accessKey: process.env.MOMO_ACCESS_KEY ?? '',
    secretKey: process.env.MOMO_SECRET_KEY ?? '',
    redirectUrl: process.env.MOMO_REDIRECT_URL ?? '',
    ipnUrl: process.env.MOMO_IPN_URL ?? '',
  },
  momoQr: {
    phone: process.env.MOMO_QR_PHONE ?? '0909123456',
    name: process.env.MOMO_QR_NAME ?? 'NGUYEN VAN A',
    minAmount: Number(process.env.MOMO_QR_MIN_AMOUNT ?? 10000),
    maxAmount: Number(process.env.MOMO_QR_MAX_AMOUNT ?? 5000000),
    expireMinutes: Number(process.env.MOMO_QR_EXPIRE_MINUTES ?? 30),
  },
}));
