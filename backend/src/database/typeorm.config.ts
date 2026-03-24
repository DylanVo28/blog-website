import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { getBackendEnvFilePaths } from '../config/env-paths';
import { buildDataSourceOptions } from '../config/database.config';

for (const envFilePath of [...getBackendEnvFilePaths()].reverse()) {
  loadEnv({
    path: envFilePath,
    override: true,
  });
}

const migrationsPath = __filename.endsWith('.ts')
  ? path.join(process.cwd(), 'src/database/migrations/*.ts')
  : path.join(process.cwd(), 'dist/database/migrations/*.js');

export default new DataSource(
  buildDataSourceOptions({
    migrationsPath,
  }),
);
