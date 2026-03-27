import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from 'cloudinary';
import { APP_DEFAULTS } from '../../common/constants';

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
  private hasWarnedIncompleteCloudinaryConfig = false;

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  getUploadConfig() {
    return {
      provider: this.isCloudinaryConfigured() ? 'cloudinary' : 'local',
      bucket: this.isCloudinaryConfigured()
        ? process.env.CLOUDINARY_CLOUD_NAME ?? ''
        : 'uploads',
      maxFileSize: MAX_IMAGE_FILE_SIZE,
      allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
    };
  }

  async uploadImage(
    file: UploadedImageFile | undefined,
    folder = 'images',
  ): Promise<StoredUpload> {
    this.assertValidImage(file);

    if (this.isCloudinaryConfigured()) {
      return this.uploadToCloudinary(file, folder);
    }

    this.warnIncompleteCloudinaryConfig();
    return this.uploadToLocal(file, folder);
  }

  async removeFileByUrl(fileUrl?: string | null) {
    await this.removeManagedFileByUrl(fileUrl, {
      suppressErrors: true,
    });
  }

  async deleteUploadedImageByUrl(fileUrl: string) {
    const deleted = await this.removeManagedFileByUrl(fileUrl, {
      suppressErrors: false,
    });

    if (!deleted) {
      throw new BadRequestException('Unsupported upload URL.');
    }

    return {
      deleted: true,
      url: fileUrl,
    };
  }

  private async removeManagedFileByUrl(
    fileUrl?: string | null,
    options?: {
      suppressErrors?: boolean;
    },
  ) {
    const suppressErrors = options?.suppressErrors ?? true;

    if (!fileUrl) {
      return false;
    }

    const cloudinaryPublicId = this.extractCloudinaryPublicId(fileUrl);
    if (cloudinaryPublicId && this.isCloudinaryConfigured()) {
      try {
        await cloudinary.uploader.destroy(cloudinaryPublicId, {
          resource_type: 'image',
          invalidate: true,
        });
      } catch (error) {
        if (!suppressErrors) {
          throw error;
        }

        this.logger.warn(
          `Unable to remove Cloudinary asset: ${cloudinaryPublicId}`,
          error instanceof Error ? error.message : undefined,
        );
      }
      return true;
    }

    const absolutePath = this.resolveLocalUploadPath(fileUrl);
    if (!absolutePath) {
      return false;
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
        if (!suppressErrors) {
          throw error;
        }

        this.logger.warn(`Unable to remove uploaded file: ${absolutePath}`);
      }
    }

    return true;
  }

  private async uploadToCloudinary(
    file: UploadedImageFile,
    folder: string,
  ): Promise<StoredUpload> {
    const extension = this.getFileExtension(file);
    const baseFileName = `${Date.now()}-${randomUUID()}`;
    const publicId = `blog-website/${folder}/${baseFileName}`;

    const result = await new Promise<UploadApiResponse>(
      (resolveUpload, rejectUpload) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            public_id: publicId,
            overwrite: false,
            unique_filename: false,
            use_filename: false,
          },
          (
            error?: UploadApiErrorResponse,
            uploadResult?: UploadApiResponse,
          ) => {
            if (error) {
              rejectUpload(error);
              return;
            }

            if (!uploadResult) {
              rejectUpload(new Error('Cloudinary upload did not return a result.'));
              return;
            }

            resolveUpload(uploadResult);
          },
        );

        stream.end(file.buffer);
      },
    );

    return {
      fileName: `${baseFileName}${result.format ? `.${result.format}` : extension}`,
      mimeType: file.mimetype,
      originalName: file.originalname,
      size: result.bytes,
      url: result.secure_url,
    };
  }

  private async uploadToLocal(
    file: UploadedImageFile,
    folder: string,
  ): Promise<StoredUpload> {
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

  private isCloudinaryConfigured() {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
        process.env.CLOUDINARY_API_KEY?.trim() &&
        process.env.CLOUDINARY_API_SECRET?.trim(),
    );
  }

  private warnIncompleteCloudinaryConfig() {
    if (this.hasWarnedIncompleteCloudinaryConfig) {
      return;
    }

    const missingKeys = [
      ['CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME],
      ['CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY],
      ['CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET],
    ]
      .filter(([, value]) => !value?.trim())
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      this.logger.warn(
        `Cloudinary is not fully configured. Falling back to local uploads. Missing: ${missingKeys.join(', ')}`,
      );
      this.hasWarnedIncompleteCloudinaryConfig = true;
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

    const host = (process.env.APP_HOST ?? APP_DEFAULTS.publicHost).trim();
    const publicHost =
      host === APP_DEFAULTS.host ? APP_DEFAULTS.publicHost : host;
    const port = Number(process.env.APP_PORT ?? APP_DEFAULTS.port);

    return `http://${publicHost}:${port}`;
  }

  private extractCloudinaryPublicId(fileUrl: string) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(fileUrl);
    } catch {
      return null;
    }

    if (parsedUrl.hostname !== 'res.cloudinary.com') {
      return null;
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const uploadIndex = pathSegments.findIndex((segment) => segment === 'upload');

    if (uploadIndex === -1) {
      return null;
    }

    const assetSegments = pathSegments.slice(uploadIndex + 1);
    const versionIndex = assetSegments.findIndex((segment) => /^v\d+$/.test(segment));
    const publicIdSegments =
      versionIndex >= 0 ? assetSegments.slice(versionIndex + 1) : assetSegments;

    if (publicIdSegments.length === 0) {
      return null;
    }

    const fileName = publicIdSegments[publicIdSegments.length - 1];
    publicIdSegments[publicIdSegments.length - 1] = fileName.replace(
      /\.[^.]+$/,
      '',
    );

    const publicId = publicIdSegments.join('/');
    return publicId.startsWith('blog-website/') ? publicId : null;
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
