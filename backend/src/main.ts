import 'reflect-metadata';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { APP_DEFAULTS } from './common/constants';
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

  const host = process.env.APP_HOST ?? APP_DEFAULTS.host;
  const port = Number(process.env.PORT ?? process.env.APP_PORT ?? APP_DEFAULTS.port);
  await app.listen(port, host);

  const publicHost =
    host === APP_DEFAULTS.host ? APP_DEFAULTS.publicHost : host;
  Logger.log(
    `Backend listening on http://${publicHost}:${port}/api`,
    'Bootstrap',
  );
}

void bootstrap();
