import 'dotenv/config';
import * as path from 'node:path';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config';

const migrationsPath = __filename.endsWith('.ts')
  ? path.join(process.cwd(), 'src/database/migrations/*.ts')
  : path.join(process.cwd(), 'dist/database/migrations/*.js');

export default new DataSource(
  buildDataSourceOptions({
    migrationsPath,
  }),
);
