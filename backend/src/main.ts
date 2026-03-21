import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppValidationPipe } from './common/pipes/validation.pipe';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new AppValidationPipe());

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
