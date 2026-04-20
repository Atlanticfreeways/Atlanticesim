import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import * as timeout from 'connect-timeout';
import { loggerConfig } from './config/logger.config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

async function bootstrap() {
  console.log('ENV DEBUG: Keys available:', Object.keys(process.env).sort());

  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig,
  });

  app.use(compression());

  app.setGlobalPrefix('api/v1');

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Setup Cookie Parser
  app.use(cookieParser());

  // Setup Cross-Site Request Forgery Protection (Wait until users authenticate)
  // We use Cookie for CSRF tokens without breaking the API state
  app.use(csurf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    }
  }));

  // Request Timeout Protection (30s)
  app.use(timeout('30s'));
  app.use((req, res, next) => {
    if (!req.timedout) next();
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configure CORS with origin restrictions
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('Atlantic eSIM Platform')
    .setDescription('Multi-provider eSIM aggregation platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();