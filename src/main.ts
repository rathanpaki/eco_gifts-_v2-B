import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { Express } from 'express';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { EnvironmentConfig } from './config/environment.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(EnvironmentConfig);

  app.setGlobalPrefix('api');

  const httpServer: unknown = app.getHttpAdapter().getInstance();
  if (!isExpressApp(httpServer)) {
    throw new Error('The configured HTTP adapter must be Express.');
  }
  httpServer.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.frontendOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      disableErrorMessages: config.isProduction,
    }),
  );

  await app.listen(config.port);
}
void bootstrap();

function isExpressApp(server: unknown): server is Express {
  return typeof server === 'function' && 'set' in server;
}
