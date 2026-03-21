import 'dotenv/config';
import * as path from 'node:path';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config';

export default new DataSource(
  buildDataSourceOptions({
    migrationsPath: path.join(
      process.cwd(),
      'src/database/migrations/*.ts',
    ),
  }),
);
