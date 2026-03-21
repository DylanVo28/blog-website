import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  createUploadSession(fileName: string, contentType: string) {
    return {
      uploadId: randomUUID(),
      fileName,
      contentType,
      uploadUrl: `https://storage.example.com/uploads/${encodeURIComponent(fileName)}`,
      expiresInSeconds: 900,
    };
  }

  getUploadConfig() {
    return {
      provider: 's3-or-minio',
      bucket: 'blog-assets',
    };
  }
}
