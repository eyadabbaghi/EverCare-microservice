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

  // Enable CORS - only for API Gateway, not for direct browser access
  // The API Gateway handles CORS for frontend requests, so we disable it here
  // to avoid duplicate CORS headers
  // app.enableCors({
  //   origin: '*',
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   allowedHeaders: 'Content-Type,Authorization',
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204,
  // });

  // Set global prefix
  app.setGlobalPrefix('EverCare');

  const port = process.env.PORT || 8096;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/EverCare`);
}
bootstrap();
