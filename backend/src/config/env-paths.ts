import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function getBackendEnvFilePaths() {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'backend/.env'),
  ];

  return candidates.filter(
    (filePath, index, paths) =>
      paths.indexOf(filePath) === index && existsSync(filePath),
  );
}
