import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import type { UploadedImageFile } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file?: UploadedImageFile) {
    const uploadedImage = await this.uploadService.uploadImage(file, 'editor');

    return {
      url: uploadedImage.url,
      mode: 'uploaded' as const,
    };
  }

  @Get('config')
  getConfig() {
    return this.uploadService.getUploadConfig();
  }
}
