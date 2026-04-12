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
  // Local frontend talks directly to this service for auth/user flows.
  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Set global prefix
  app.setGlobalPrefix('EverCare');

  const port = process.env.PORT || 8096;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/EverCare`);
}
bootstrap();
