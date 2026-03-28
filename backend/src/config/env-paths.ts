import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_BACKEND_APP_ENV = 'development';

const BACKEND_APP_ENV_ALIASES: Record<string, string> = {
  dev: 'development',
  development: 'development',
  stage: 'staging',
  staging: 'staging',
  prod: 'production',
  production: 'production',
};

export function getBackendAppEnv() {
  const rawAppEnv =
    process.env.APP_ENV?.trim().toLowerCase() ||
    process.env.NODE_ENV?.trim().toLowerCase() ||
    DEFAULT_BACKEND_APP_ENV;

  return BACKEND_APP_ENV_ALIASES[rawAppEnv] ?? rawAppEnv;
}

export function getBackendEnvFilePaths() {
  const appEnv = getBackendAppEnv();
  const fileNames = [`.env.${appEnv}`, '.env'];
  const candidates = fileNames.flatMap((fileName) => [
    resolve(process.cwd(), fileName),
    resolve(process.cwd(), 'backend', fileName),
  ]);

  return candidates.filter(
    (filePath, index, paths) =>
      paths.indexOf(filePath) === index && existsSync(filePath),
  );
}
