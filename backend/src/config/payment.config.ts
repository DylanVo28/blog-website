import { registerAs } from '@nestjs/config';

function parseAllowedAmounts(input: string | undefined, fallback: number[]) {
  if (!input?.trim()) {
    return fallback;
  }

  const values = input
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

  return values.length ? values : fallback;
}

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
    allowedAmounts: parseAllowedAmounts(process.env.MOMO_QR_ALLOWED_AMOUNTS, [
      10000,
      50000,
      100000,
      200000,
      500000,
      1000000,
    ]),
  },
  vcbQr: {
    bankCode: process.env.VCB_QR_BANK_CODE ?? '970436',
    bankName: process.env.VCB_QR_BANK_NAME ?? 'Vietcombank',
    accountNumber: process.env.VCB_QR_ACCOUNT_NUMBER ?? '0123456789',
    accountName: process.env.VCB_QR_ACCOUNT_NAME ?? 'NGUYEN VAN A',
    template: process.env.VCB_QR_TEMPLATE ?? 'compact2',
    minAmount: Number(process.env.VCB_QR_MIN_AMOUNT ?? 10000),
    maxAmount: Number(process.env.VCB_QR_MAX_AMOUNT ?? 5000000),
    expireMinutes: Number(process.env.VCB_QR_EXPIRE_MINUTES ?? 15),
    allowedAmounts: parseAllowedAmounts(process.env.VCB_QR_ALLOWED_AMOUNTS, [
      10000,
      20000,
      50000,
      100000,
      200000,
      500000,
      1000000,
    ]),
  },
  casso: {
    webhookSecret: process.env.CASSO_WEBHOOK_SECRET ?? '',
  },
  sepay: {
    apiKey: process.env.SEPAY_API_KEY ?? '',
  },
}));
