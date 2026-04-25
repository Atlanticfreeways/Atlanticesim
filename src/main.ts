import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { loggerConfig } from './config/logger.config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { existsSync } from 'fs';
import * as dotenv from 'dotenv';

// Force .env to override system env vars BEFORE any modules load
const envConfig = dotenv.config({ path: '.env' });
if (envConfig.parsed) {
  Object.assign(process.env, envConfig.parsed);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: loggerConfig,
  });

  app.use(compression());

  app.setGlobalPrefix('api/v1', {
    exclude: ['/'],
  });

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS — only needed if frontend is served separately (dev mode)
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('Atlantic eSIM Platform')
    .setDescription('Multi-provider eSIM aggregation platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve frontend static build from single port (production)
  const frontendPath = join(__dirname, '..', 'frontend', 'dist');
  if (existsSync(frontendPath)) {
    app.useStaticAssets(frontendPath);
    app.setBaseViewsDir(frontendPath);
    logger.log(`Serving frontend from ${frontendPath}`);

    // SPA fallback — serve index.html for non-API routes
    const { Router } = await import('express');
    const spaRouter = Router();
    spaRouter.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(join(frontendPath, 'index.html'));
    });
    app.use(spaRouter);
  } else {
    logger.warn('Frontend build not found — API-only mode');
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Atlantic eSIM running on port ${port}`);
}
bootstrap();
