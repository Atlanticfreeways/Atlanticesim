import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import * as cookieParser from 'cookie-parser';

describe('B2B & Security (Phase 5-6) E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Security Throttling (Phase 5)', () => {
    it('should throttle auth login beyond 5 requests', async () => {
      // Simulate 6 rapid login attempts
      const loginPayload = { email: 'test@example.com', password: 'password123' };
      
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginPayload);
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginPayload);

      expect(response.status).toBe(429); // Too Many Requests
    });

    it('should protect payments with strict throttling', async () => {
      // Payments allow max 10 per minute
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/payments/create-session')
          .send({ orderId: 'test-order', method: 'paystack' });
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/create-session')
        .send({ orderId: 'test-order', method: 'paystack' });

      expect(response.status).toBe(429);
    });
  });

  describe('Partner API & B2B (Phase 6)', () => {
    it('should block access without x-api-key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/partners/packages');
      
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('API Key missing');
    });

    it('should deny invalid API keys', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/partners/packages')
        .set('x-api-key', 'at_invalid_format');
      
      expect(response.status).toBe(401);
    });

    // Note: Valid API key test requires a seed in the test DB
    // We would mock the ApiKeyGuard or seed a BUSINESS_PARTNER user with an ApiToken
  });

  describe('CSRF Protection', () => {
    it('should block POST requests without CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'new@example.com', password: 'password123', name: 'Tester' });
      
      // csurf typically returns 403 Forbidden for missing secret/token
      expect(response.status).toBe(403);
    });
  });
});
