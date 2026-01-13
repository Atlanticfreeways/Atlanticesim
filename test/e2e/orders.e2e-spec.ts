import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/config/prisma.service';
import { setupE2ETest, teardownE2ETest, cleanupDatabase } from './setup';
import * as request from 'supertest';

describe('Orders E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const setup = await setupE2ETest();
    app = setup.app;
    prismaService = setup.prismaService;
  });

  afterAll(async () => {
    await teardownE2ETest();
  });

  beforeEach(async () => {
    await cleanupDatabase(prismaService);

    // Register and login
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

    token = registerRes.body.access_token;
    userId = registerRes.body.user.id;
  });

  describe('POST /api/v1/orders', () => {
    it('should create order successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.userId).toBe(userId);
      expect(res.body.status).toBe('PROCESSING');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          // missing providerId
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should list user orders', async () => {
      // Create order
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      // List orders
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return empty array for user with no orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should get order by id', async () => {
      // Create order
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      const orderId = createRes.body.id;

      // Get order
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(orderId);
      expect(res.body.userId).toBe(userId);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should prevent accessing other users orders', async () => {
      // Create order with user 1
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      const orderId = createRes.body.id;

      // Register user 2
      const user2Res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'Password123!',
          name: 'User 2',
        });

      const token2 = user2Res.body.access_token;

      // Try to access user 1's order with user 2
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders/order-1');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/orders/:id/cancel', () => {
    it('should cancel order successfully', async () => {
      // Create order
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      const orderId = createRes.body.id;

      // Cancel order
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CANCELLED');
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders/nonexistent/cancel')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for already cancelled order', async () => {
      // Create and cancel order
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      const orderId = createRes.body.id;

      // Cancel first time
      await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      // Try to cancel again
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders/order-1/cancel');

      expect(res.status).toBe(401);
    });
  });

  describe('Order Response Format', () => {
    it('should include all required fields in order response', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('packageId');
      expect(res.body).toHaveProperty('providerId');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('paymentAmount');
      expect(res.body).toHaveProperty('paymentCurrency');
      expect(res.body).toHaveProperty('paymentMethod');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('should not expose sensitive data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('secret');
    });
  });
});
