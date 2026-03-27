import { registerAs } from '@nestjs/config';
import { JWT_DEFAULTS } from '../common/constants';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret:
    process.env.JWT_ACCESS_SECRET ?? JWT_DEFAULTS.accessSecretPlaceholder,
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ?? JWT_DEFAULTS.refreshSecretPlaceholder,
  verificationSecret:
    process.env.JWT_VERIFICATION_SECRET ??
    JWT_DEFAULTS.verificationSecretPlaceholder,
  accessExpiresIn:
    process.env.JWT_ACCESS_EXPIRES_IN ?? JWT_DEFAULTS.accessExpiresIn,
  refreshExpiresIn:
    process.env.JWT_REFRESH_EXPIRES_IN ?? JWT_DEFAULTS.refreshExpiresIn,
  verificationExpiresIn:
    process.env.JWT_VERIFICATION_EXPIRES_IN ??
    JWT_DEFAULTS.verificationExpiresIn,
}));
