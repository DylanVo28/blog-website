import { registerAs } from '@nestjs/config';

export const socialAuthConfig = registerAs('socialAuth', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ??
      'http://localhost:3000/api/auth/google/callback',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GITHUB_CALLBACK_URL ??
      'http://localhost:3000/api/auth/github/callback',
  },
  frontendSuccessUrl:
    process.env.SOCIAL_AUTH_SUCCESS_URL ??
    'http://localhost:3001/auth/social/callback',
  frontendFailureUrl:
    process.env.SOCIAL_AUTH_FAILURE_URL ??
    'http://localhost:3001/login?error=social_auth_failed',
}));
