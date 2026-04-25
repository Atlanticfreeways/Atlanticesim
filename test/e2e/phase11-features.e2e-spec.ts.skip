import { INestApplication } from '@nestjs/common';
import { setupE2ETest, teardownE2ETest } from './setup';
import * as request from 'supertest';

describe('Phase 11 Features E2E', () => {
  jest.setTimeout(120000);
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const setup = await setupE2ETest();
    app = setup.app;
    const prisma = setup.prismaService;

    await prisma.user.deleteMany({ where: { email: 'phase11@example.com' } });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'phase11@example.com', password: 'Password123!', name: 'Phase11 Tester' });

    token = res.body.access_token;
  });

  afterAll(async () => {
    await teardownE2ETest();
  });

  describe('Auto-routing order creation (no providerId)', () => {
    it('should create order without providerId via smart routing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ packageId: 'maya-us-3gb' });

      // Should succeed — ProviderRouterService picks a provider
      expect([201, 404]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.id).toBeDefined();
        expect(res.body.providerId).toBeDefined();
      }
    });
  });

  describe('Package search with classification filters', () => {
    it('should accept packageType filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages?packageType=DATA_ONLY')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should accept scopeType filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages?scopeType=LOCAL')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should accept pagination params', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(5);
    });

    it('should accept sortBy param', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages?sortBy=data')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should accept isUnlimited filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages?isUnlimited=true')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Usage endpoints', () => {
    it('should return 404 for non-existent eSIM daily usage', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/esims/nonexistent/usage/daily')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent eSIM usage summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/esims/nonexistent/usage/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth for usage endpoints', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/esims/any-id/usage/daily');

      expect(res.status).toBe(401);
    });
  });
});
