import { registerAs } from '@nestjs/config';
import { REDIS_DEFAULTS } from '../common/constants';

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseRedisUrl(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const isTls = url.protocol === 'rediss:';

  return {
    host: url.hostname,
    port: toNumber(url.port, isTls ? 6380 : 6379),
    username: url.username ? decodeURIComponent(url.username) : '',
    password: url.password ? decodeURIComponent(url.password) : '',
    tls: isTls ? {} : undefined,
  };
}

export const redisConfig = registerAs('redis', () => {
  const parsedUrl = parseRedisUrl(process.env.REDIS_URL);

  return {
    ...(parsedUrl ?? {}),
    host: parsedUrl?.host ?? process.env.REDIS_HOST ?? REDIS_DEFAULTS.host,
    port:
      parsedUrl?.port ??
      toNumber(process.env.REDIS_PORT, REDIS_DEFAULTS.port),
    username: parsedUrl?.username ?? process.env.REDIS_USERNAME ?? '',
    password: parsedUrl?.password ?? process.env.REDIS_PASSWORD ?? '',
    tls:
      parsedUrl?.tls ??
      (process.env.REDIS_TLS === 'true' || REDIS_DEFAULTS.tls ? {} : undefined),
  };
});
