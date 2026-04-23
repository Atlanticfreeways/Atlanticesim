import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { writeFileSync } from 'fs';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Atlantic eSIM Platform')
    .setDescription('Multi-provider eSIM aggregation platform API — B2B & Retail')
    .setVersion('3.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and registration')
    .addTag('Packages', 'Package search and details')
    .addTag('Orders', 'Order creation and management')
    .addTag('eSIMs', 'eSIM management, usage, and activation')
    .addTag('Partners', 'B2B partner console, wallets, webhooks')
    .addTag('Admin', 'Admin operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('docs/openapi.json', JSON.stringify(document, null, 2));
  console.log('OpenAPI spec written to docs/openapi.json');

  await app.close();
}

generate();
