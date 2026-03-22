import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
]);

const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
};

export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredUpload {
  fileName: string;
  mimeType: string;
  originalName: string;
  size: number;
  url: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadRoot = join(process.cwd(), 'uploads');

  getUploadConfig() {
    return {
      provider: 'local',
      bucket: 'uploads',
      maxFileSize: MAX_IMAGE_FILE_SIZE,
      allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
    };
  }

  async uploadImage(
    file: UploadedImageFile | undefined,
    folder = 'images',
  ): Promise<StoredUpload> {
    this.assertValidImage(file);

    const extension = this.getFileExtension(file);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const targetDirectory = join(this.uploadRoot, folder);
    const targetPath = join(targetDirectory, fileName);

    await mkdir(targetDirectory, {
      recursive: true,
    });
    await writeFile(targetPath, file.buffer);

    const relativePath = join(folder, fileName).split(sep).join('/');

    return {
      fileName,
      mimeType: file.mimetype,
      originalName: file.originalname,
      size: file.size,
      url: `${this.getPublicBaseUrl()}/uploads/${relativePath}`,
    };
  }

  async removeFileByUrl(fileUrl?: string | null) {
    if (!fileUrl) {
      return;
    }

    const absolutePath = this.resolveLocalUploadPath(fileUrl);
    if (!absolutePath) {
      return;
    }

    try {
      await unlink(absolutePath);
    } catch (error) {
      const errorCode =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
          ? error.code
          : null;

      if (errorCode !== 'ENOENT') {
        this.logger.warn(`Unable to remove uploaded file: ${absolutePath}`);
      }
    }
  }

  private assertValidImage(file?: UploadedImageFile): asserts file is UploadedImageFile {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('Uploaded image is empty.');
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      throw new BadRequestException('Image size must not exceed 10MB.');
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported image format.');
    }
  }

  private getFileExtension(file: UploadedImageFile) {
    const originalExtension = extname(file.originalname).toLowerCase();
    if (originalExtension) {
      return originalExtension;
    }

    return MIME_TYPE_EXTENSIONS[file.mimetype] ?? '.bin';
  }

  private getPublicBaseUrl() {
    const explicitPublicUrl = process.env.APP_PUBLIC_URL?.trim();
    if (explicitPublicUrl) {
      return explicitPublicUrl.replace(/\/$/, '');
    }

    const host = (process.env.APP_HOST ?? 'localhost').trim();
    const publicHost = host === '0.0.0.0' ? 'localhost' : host;
    const port = Number(process.env.APP_PORT ?? 3000);

    return `http://${publicHost}:${port}`;
  }

  private resolveLocalUploadPath(fileUrl: string) {
    let pathname: string;
    let isAbsoluteUrl = false;

    try {
      pathname = new URL(fileUrl).pathname;
      isAbsoluteUrl = true;
    } catch {
      pathname = fileUrl;
    }

    const uploadsPrefix = '/uploads/';
    const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;

    if (isAbsoluteUrl && !normalizedPathname.startsWith(uploadsPrefix)) {
      return null;
    }

    const uploadPath = normalizedPathname.startsWith(uploadsPrefix)
      ? normalizedPathname.slice(uploadsPrefix.length)
      : normalizedPathname.replace(/^\/+/, '');

    if (!uploadPath) {
      return null;
    }

    const candidatePath = resolve(this.uploadRoot, uploadPath);
    const uploadRootPath = resolve(this.uploadRoot);
    const candidateRelativePath = relative(uploadRootPath, candidatePath);

    if (
      candidateRelativePath.startsWith(`..${sep}`) ||
      candidateRelativePath === '..'
    ) {
      return null;
    }

    return candidatePath;
  }
}
