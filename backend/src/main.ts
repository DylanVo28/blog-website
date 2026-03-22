import 'reflect-metadata';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppValidationPipe } from './common/pipes/validation.pipe';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new AppValidationPipe());
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const host = process.env.APP_HOST ?? '0.0.0.0';
  const port = Number(process.env.APP_PORT ?? 3000);
  await app.listen(port, host);

  const publicHost = host === '0.0.0.0' ? 'localhost' : host;
  Logger.log(
    `Backend listening on http://${publicHost}:${port}/api`,
    'Bootstrap',
  );
}

void bootstrap();
