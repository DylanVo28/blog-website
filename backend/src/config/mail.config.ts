import { registerAs } from '@nestjs/config';

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}

export const mailConfig = registerAs('mail', () => ({
  host: process.env.SMTP_HOST ?? '',
  port: toNumber(process.env.SMTP_PORT, 587),
  secure: toBoolean(process.env.SMTP_SECURE),
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS ?? '',
  fromName: process.env.SMTP_FROM_NAME ?? 'Inkline',
  fromEmail: process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? '',
  requireTls: toBoolean(process.env.SMTP_REQUIRE_TLS),
  ignoreTls: toBoolean(process.env.SMTP_IGNORE_TLS),
}));
