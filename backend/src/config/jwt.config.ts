import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'replace-access-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'replace-refresh-secret',
  verificationSecret:
    process.env.JWT_VERIFICATION_SECRET ?? 'replace-verification-secret',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  verificationExpiresIn: process.env.JWT_VERIFICATION_EXPIRES_IN ?? '15m',
}));
