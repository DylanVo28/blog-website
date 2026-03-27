export const APP_DEFAULTS = {
  host: '0.0.0.0',
  publicHost: 'localhost',
  port: 3000,
  frontendUrl: 'http://localhost:3001',
} as const;

export const DATABASE_DEFAULTS = {
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  database: 'blog_platform',
  ssl: false,
  logging: false,
} as const;

export const MAIL_DEFAULTS = {
  port: 587,
  secure: false,
  fromName: 'Inkline',
  requireTls: false,
  ignoreTls: false,
} as const;

export const REDIS_DEFAULTS = {
  host: 'localhost',
  port: 6379,
  tls: false,
} as const;

export const JWT_DEFAULTS = {
  accessSecretPlaceholder: 'replace-access-secret',
  refreshSecretPlaceholder: 'replace-refresh-secret',
  verificationSecretPlaceholder: 'replace-verification-secret',
  accessExpiresIn: '15m',
  refreshExpiresIn: '7d',
  verificationExpiresIn: '15m',
} as const;

export const AI_DEFAULTS = {
  provider: 'anthropic',
  model: 'claude-opus-4.6',
  embeddingModel: 'text-embedding-004',
  embeddingDimensions: 768,
  baseUrl: 'https://api.anthropic.com',
  apiVersion: '2023-06-01',
  maxTokens: 1024,
  temperature: 0.2,
  timeoutMs: 30000,
} as const;

export const PAYMENT_DEFAULTS = {
  momoQr: {
    minAmount: 10000,
    maxAmount: 5000000,
    expireMinutes: 30,
    allowedAmounts: [10000, 50000, 100000, 200000, 500000, 1000000],
  },
  vcbQr: {
    bankCode: '970436',
    bankName: 'Vietcombank',
    template: 'compact2',
    minAmount: 10000,
    maxAmount: 5000000,
    expireMinutes: 15,
    allowedAmounts: [10000, 20000, 50000, 100000, 200000, 500000, 1000000],
  },
  ocbQr: {
    bankCode: '970448',
    bankName: 'OCB',
    template: 'compact2',
    minAmount: 10000,
    maxAmount: 5000000,
    expireMinutes: 15,
    allowedAmounts: [10000, 20000, 50000, 100000, 200000, 500000, 1000000],
  },
} as const;

export const SOCIAL_AUTH_DEFAULTS = {
  frontendSuccessPath: '/auth/social/callback',
  frontendFailurePath: '/login?error=social_auth_failed',
} as const;
