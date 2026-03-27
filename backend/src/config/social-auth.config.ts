import { registerAs } from '@nestjs/config';
import { APP_DEFAULTS, SOCIAL_AUTH_DEFAULTS } from '../common/constants';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? trimTrailingSlash(value) : '';
}

export const socialAuthConfig = registerAs('socialAuth', () => {
  const frontendBaseUrl = trimTrailingSlash(
    process.env.FRONTEND_URL?.trim() || APP_DEFAULTS.frontendUrl,
  );

  return {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackUrl: readOptionalEnv('GOOGLE_CALLBACK_URL'),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      callbackUrl: readOptionalEnv('GITHUB_CALLBACK_URL'),
    },
    publicApiUrl: readOptionalEnv('API_PUBLIC_URL'),
    frontendBaseUrl,
    frontendSuccessUrl:
      process.env.SOCIAL_AUTH_SUCCESS_URL?.trim() ||
      `${frontendBaseUrl}${SOCIAL_AUTH_DEFAULTS.frontendSuccessPath}`,
    frontendFailureUrl:
      process.env.SOCIAL_AUTH_FAILURE_URL?.trim() ||
      `${frontendBaseUrl}${SOCIAL_AUTH_DEFAULTS.frontendFailurePath}`,
  };
});
