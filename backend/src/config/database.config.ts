import * as path from 'node:path';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { DATABASE_DEFAULTS } from '../common/constants';

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isSslEnabled(): boolean {
  return process.env.DB_SSL === 'true' ? true : DATABASE_DEFAULTS.ssl;
}

function getDatabaseBaseOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? DATABASE_DEFAULTS.host,
    port: toNumber(process.env.DB_PORT, DATABASE_DEFAULTS.port),
    username: process.env.DB_USERNAME ?? DATABASE_DEFAULTS.username,
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? DATABASE_DEFAULTS.database,
    synchronize: false,
    logging:
      process.env.DB_LOGGING === 'true' ? true : DATABASE_DEFAULTS.logging,
    ssl: isSslEnabled() ? { rejectUnauthorized: false } : false,
    entities: [],
  };
}

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST ?? DATABASE_DEFAULTS.host,
  port: toNumber(process.env.DB_PORT, DATABASE_DEFAULTS.port),
  username: process.env.DB_USERNAME ?? DATABASE_DEFAULTS.username,
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? DATABASE_DEFAULTS.database,
  ssl: isSslEnabled(),
}));

export function buildDataSourceOptions(options?: {
  migrationsPath?: string;
}): DataSourceOptions {
  return {
    ...getDatabaseBaseOptions(),
    migrations: [
      options?.migrationsPath ??
        path.join(process.cwd(), 'dist/database/migrations/*.js'),
    ],
  };
}

export function buildTypeOrmOptions(): TypeOrmModuleOptions {
  return {
    ...buildDataSourceOptions(),
    autoLoadEntities: true,
  };
}
