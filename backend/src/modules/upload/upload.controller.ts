import { Body, Controller, Get, Post } from '@nestjs/common';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  presign(
    @Body('fileName') fileName: string,
    @Body('contentType') contentType = 'application/octet-stream',
  ) {
    return this.uploadService.createUploadSession(fileName, contentType);
  }

  @Get('config')
  getConfig() {
    return this.uploadService.getUploadConfig();
  }
}
