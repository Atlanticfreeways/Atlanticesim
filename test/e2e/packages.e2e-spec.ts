import { INestApplication } from '@nestjs/common';
import { setupE2ETest, teardownE2ETest } from './setup';
import * as request from 'supertest';

describe('Packages E2E Tests', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const setup = await setupE2ETest();
    app = setup.app;

    // Register and login
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

    token = registerRes.body.access_token;
  });

  afterAll(async () => {
    await teardownE2ETest();
  });

  describe('GET /api/v1/packages', () => {
    it('should search packages', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter packages by country', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages?country=US')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter packages by data amount', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages?dataMin=5&dataMax=20')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages');

      expect(res.status).toBe(401);
    });

    it('should return sorted packages by price', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      if (res.body.length > 1) {
        for (let i = 0; i < res.body.length - 1; i++) {
          expect(res.body[i].price).toBeLessThanOrEqual(res.body[i + 1].price);
        }
      }
    });
  });

  describe('GET /api/v1/packages/:id', () => {
    it('should get package details', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages/pkg-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('price');
    });

    it('should return 404 for non-existent package', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages/pkg-1');

      expect(res.status).toBe(401);
    });
  });

  describe('Package Response Format', () => {
    it('should include all required fields in package response', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/packages')
        .set('Authorization', `Bearer ${token}`);

      if (res.body.length > 0) {
        const pkg = res.body[0];
        expect(pkg).toHaveProperty('id');
        expect(pkg).toHaveProperty('name');
        expect(pkg).toHaveProperty('dataAmount');
        expect(pkg).toHaveProperty('price');
        expect(pkg).toHaveProperty('currency');
      }
    });
  });
});
