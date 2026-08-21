import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');

  // Increase body size limit to 50mb to support base64-encoded PDF attachments in QPR submissions
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`QPR NestJS Back-End running on: http://localhost:${port}`);
}
bootstrap();
