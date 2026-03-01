import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve static files for uploads
  app.use(
    '/EverCare/uploads',
    express.static(path.join(process.cwd(), 'uploads')),
  );

  // Enable CORS
  app.enableCors();

  // Set global prefix
  app.setGlobalPrefix('EverCare');

  const port = process.env.PORT || 8096;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/EverCare`);
}
bootstrap();
