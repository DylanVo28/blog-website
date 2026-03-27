import { registerAs } from '@nestjs/config';
import { PAYMENT_DEFAULTS } from '../common/constants';

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
    phone: process.env.MOMO_QR_PHONE ?? '',
    name: process.env.MOMO_QR_NAME ?? '',
    minAmount: Number(
      process.env.MOMO_QR_MIN_AMOUNT ?? PAYMENT_DEFAULTS.momoQr.minAmount,
    ),
    maxAmount: Number(
      process.env.MOMO_QR_MAX_AMOUNT ?? PAYMENT_DEFAULTS.momoQr.maxAmount,
    ),
    expireMinutes: Number(
      process.env.MOMO_QR_EXPIRE_MINUTES ??
        PAYMENT_DEFAULTS.momoQr.expireMinutes,
    ),
    allowedAmounts: parseAllowedAmounts(
      process.env.MOMO_QR_ALLOWED_AMOUNTS,
      [...PAYMENT_DEFAULTS.momoQr.allowedAmounts],
    ),
  },
  vcbQr: {
    bankCode: process.env.VCB_QR_BANK_CODE ?? PAYMENT_DEFAULTS.vcbQr.bankCode,
    bankName: process.env.VCB_QR_BANK_NAME ?? PAYMENT_DEFAULTS.vcbQr.bankName,
    accountNumber: process.env.VCB_QR_ACCOUNT_NUMBER ?? '',
    accountName: process.env.VCB_QR_ACCOUNT_NAME ?? '',
    template: process.env.VCB_QR_TEMPLATE ?? PAYMENT_DEFAULTS.vcbQr.template,
    minAmount: Number(
      process.env.VCB_QR_MIN_AMOUNT ?? PAYMENT_DEFAULTS.vcbQr.minAmount,
    ),
    maxAmount: Number(
      process.env.VCB_QR_MAX_AMOUNT ?? PAYMENT_DEFAULTS.vcbQr.maxAmount,
    ),
    expireMinutes: Number(
      process.env.VCB_QR_EXPIRE_MINUTES ?? PAYMENT_DEFAULTS.vcbQr.expireMinutes,
    ),
    allowedAmounts: parseAllowedAmounts(
      process.env.VCB_QR_ALLOWED_AMOUNTS,
      [...PAYMENT_DEFAULTS.vcbQr.allowedAmounts],
    ),
  },
  ocbQr: {
    bankCode: process.env.OCB_QR_BANK_CODE ?? PAYMENT_DEFAULTS.ocbQr.bankCode,
    bankName: process.env.OCB_QR_BANK_NAME ?? PAYMENT_DEFAULTS.ocbQr.bankName,
    accountNumber: process.env.OCB_QR_ACCOUNT_NUMBER ?? '',
    accountName: process.env.OCB_QR_ACCOUNT_NAME ?? '',
    template: process.env.OCB_QR_TEMPLATE ?? PAYMENT_DEFAULTS.ocbQr.template,
    minAmount: Number(
      process.env.OCB_QR_MIN_AMOUNT ?? PAYMENT_DEFAULTS.ocbQr.minAmount,
    ),
    maxAmount: Number(
      process.env.OCB_QR_MAX_AMOUNT ?? PAYMENT_DEFAULTS.ocbQr.maxAmount,
    ),
    expireMinutes: Number(
      process.env.OCB_QR_EXPIRE_MINUTES ?? PAYMENT_DEFAULTS.ocbQr.expireMinutes,
    ),
    allowedAmounts: parseAllowedAmounts(
      process.env.OCB_QR_ALLOWED_AMOUNTS,
      [...PAYMENT_DEFAULTS.ocbQr.allowedAmounts],
    ),
  },
  casso: {
    webhookSecret: process.env.CASSO_WEBHOOK_SECRET ?? '',
  },
  sepay: {
    apiKey: process.env.SEPAY_API_KEY ?? '',
  },
}));
