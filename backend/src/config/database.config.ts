import * as path from 'node:path';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isSslEnabled(): boolean {
  return process.env.DB_SSL === 'true';
}

function getDatabaseBaseOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: toNumber(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'blog_platform',
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
    ssl: isSslEnabled() ? { rejectUnauthorized: false } : false,
    entities: [],
  };
}

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: toNumber(process.env.DB_PORT, 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'blog_platform',
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
