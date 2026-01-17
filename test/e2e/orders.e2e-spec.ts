import { INestApplication } from '@nestjs/common';
import { setupE2ETest, teardownE2ETest } from './setup';
import * as request from 'supertest';

describe('Orders E2E Tests', () => {
  jest.setTimeout(120000);
  let app: INestApplication;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const setup = await setupE2ETest();
    app = setup.app;
    const prismaService = setup.prismaService;

    // Clean up
    await prismaService.order.deleteMany({});
    await prismaService.user.deleteMany({ where: { email: 'order-test@example.com' } });

    // Register
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'order-test@example.com',
        password: 'Password123!',
        name: 'Order Tester',
      });

    token = registerRes.body.access_token;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await teardownE2ETest();
  });

  describe('POST /api/v1/orders', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({
          packageId: 'pkg-1',
          providerId: 'airalo'
        })
        .expect(401);
    });

    it('should create an order successfully using Maya Mobile (Mock)', async () => {
      // Using the mock data package ID from MayaMobileAdapter
      const packageId = 'maya-us-3gb';
      const providerId = 'maya-mobile';

      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId,
          providerId,
          paymentMethod: 'card'
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.userId).toBe(userId);
      expect(res.body.packageId).toBe(packageId);
      expect(res.body.providerId).toBe(providerId);
      // Mock returns 'completed' status
      expect(res.body.status).toBe('completed');
    });

    it('should handle idempotency correctly', async () => {
      const idempotencyKey = 'unique-key-123';
      const packageId = 'maya-us-5gb'; // Another mock package
      const providerId = 'maya-mobile';

      // First Request
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId,
          providerId,
          idempotencyKey
        })
        .expect(201);

      const orderId = res1.body.id;

      // Second Request with same key
      const res2 = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId,
          providerId,
          idempotencyKey
        })
        .expect(201);

      // Should return exact same order
      expect(res2.body.id).toBe(orderId);
    });

    it('should return 404 for non-existent package', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'invalid-id',
          providerId: 'maya-mobile'
        })
        .expect(404);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should retrieve user orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // We created at least 2 orders above
    });
  });
});
