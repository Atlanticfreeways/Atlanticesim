import { INestApplication } from '@nestjs/common';
import { setupE2ETest, teardownE2ETest, cleanupDatabase } from './setup';
import { PrismaService } from '../../src/config/prisma.service';
import * as request from 'supertest';

describe('eSIMs E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let token: string;
  let userId: string;
  let esimId: string;

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

    // Create order to get eSIM
    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        packageId: 'pkg-1',
        providerId: 'provider-1',
        paymentMethod: 'card',
      });

    if (orderRes.body.esim) {
      esimId = orderRes.body.esim.id;
    }
  });

  describe('GET /api/v1/esims', () => {
    it('should list user eSIMs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/esims')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/esims');

      expect(res.status).toBe(401);
    });

    it('should return empty array for user with no eSIMs', async () => {
      // Register new user without orders
      const newUserRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          name: 'New User',
        });

      const newToken = newUserRes.body.access_token;

      const res = await request(app.getHttpServer())
        .get('/api/v1/esims')
        .set('Authorization', `Bearer ${newToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  describe('GET /api/v1/esims/:id', () => {
    it('should get eSIM by id', async () => {
      if (!esimId) {
        throw new Error('eSIM ID not set');
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/esims/${esimId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(esimId);
      expect(res.body.userId).toBe(userId);
    });

    it('should return 404 for non-existent eSIM', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/esims/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should prevent accessing other users eSIMs', async () => {
      if (!esimId) {
        throw new Error('eSIM ID not set');
      }

      // Register user 2
      const user2Res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'Password123!',
          name: 'User 2',
        });

      const token2 = user2Res.body.access_token;

      // Try to access user 1's eSIM
      const res = await request(app.getHttpServer())
        .get(`/api/v1/esims/${esimId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/esims/esim-1');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/esims/:id/qrcode', () => {
    it('should get QR code for eSIM', async () => {
      if (!esimId) {
        throw new Error('eSIM ID not set');
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/esims/${esimId}/qrcode`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('qrCode');
    });

    it('should return 404 for non-existent eSIM', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/esims/nonexistent/qrcode')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/esims/:id/activate', () => {
    it('should activate eSIM', async () => {
      if (!esimId) {
        throw new Error('eSIM ID not set');
      }

      const res = await request(app.getHttpServer())
        .post(`/api/v1/esims/${esimId}/activate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent eSIM', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/esims/nonexistent/activate')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for already activated eSIM', async () => {
      if (!esimId) {
        throw new Error('eSIM ID not set');
      }

      // Activate first time
      await request(app.getHttpServer())
        .post(`/api/v1/esims/${esimId}/activate`)
        .set('Authorization', `Bearer ${token}`);

      // Try to activate again
      const res = await request(app.getHttpServer())
        .post(`/api/v1/esims/${esimId}/activate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/esims/esim-1/activate');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/esims/:id/usage', () => {
    it('should get usage data for eSIM', async () => {
      if (!esimId) {
        throw new Error('eSIM ID not set');
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/esims/${esimId}/usage`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dataUsed');
      expect(res.body).toHaveProperty('dataTotal');
    });

    it('should return 404 for non-existent eSIM', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/esims/nonexistent/usage')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('eSIM Response Format', () => {
    it('should include all required fields in eSIM response', async () => {
      if (!esimId) {
        throw new Error('eSIM ID not set');
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/esims/${esimId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('iccid');
      expect(res.body).toHaveProperty('dataTotal');
    });

    it('should not expose sensitive data', async () => {
      if (!esimId) {
        throw new Error('eSIM ID not set');
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/esims/${esimId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('secret');
    });
  });
});
