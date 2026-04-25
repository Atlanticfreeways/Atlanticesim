import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/config/prisma.service';
import { setupE2ETest, teardownE2ETest, cleanupDatabase } from './setup';
import * as request from 'supertest';

describe('User Journey E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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
  });

  describe('Complete User Journey', () => {
    it('should complete full workflow: register -> login -> search -> order -> activate', async () => {
      // 1. Register user
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body).toHaveProperty('access_token');
      const token = registerRes.body.access_token;

      // 2. Get user profile
      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.email).toBe('user@example.com');

      // 3. Search packages
      const packagesRes = await request(app.getHttpServer())
        .get('/api/v1/packages?country=US')
        .set('Authorization', `Bearer ${token}`);

      expect(packagesRes.status).toBe(200);
      expect(Array.isArray(packagesRes.body)).toBe(true);

      // 4. Create order
      const orderRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      expect(orderRes.status).toBe(201);
      expect(orderRes.body).toHaveProperty('id');
      const orderId = orderRes.body.id;

      // 5. Get order details
      const orderDetailsRes = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(orderDetailsRes.status).toBe(200);
      expect(orderDetailsRes.body.id).toBe(orderId);

      // 6. List user orders
      const ordersRes = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(ordersRes.status).toBe(200);
      expect(Array.isArray(ordersRes.body)).toBe(true);
      expect(ordersRes.body.length).toBeGreaterThan(0);

      // 7. Get eSIM details
      if (orderRes.body.esim) {
        const esimRes = await request(app.getHttpServer())
          .get(`/api/v1/esims/${orderRes.body.esim.id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(esimRes.status).toBe(200);
        expect(esimRes.body.id).toBe(orderRes.body.esim.id);

        // 8. Activate eSIM
        const activateRes = await request(app.getHttpServer())
          .post(`/api/v1/esims/${orderRes.body.esim.id}/activate`)
          .set('Authorization', `Bearer ${token}`);

        expect(activateRes.status).toBe(200);
      }
    });

    it('should handle multiple orders for same user', async () => {
      // Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      const token = registerRes.body.access_token;

      // Create first order
      const order1Res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      expect(order1Res.status).toBe(201);

      // Create second order
      const order2Res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-2',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      expect(order2Res.status).toBe(201);

      // List orders
      const ordersRes = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(ordersRes.status).toBe(200);
      expect(ordersRes.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should prevent unauthorized access', async () => {
      // Try to access without token
      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/user/profile');

      expect(profileRes.status).toBe(401);
    });

    it('should prevent accessing other users orders', async () => {
      // Register user 1
      const user1Res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user1@example.com',
          password: 'Password123!',
          name: 'User 1',
        });

      const token1 = user1Res.body.access_token;

      // Register user 2
      const user2Res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'Password123!',
          name: 'User 2',
        });

      const token2 = user2Res.body.access_token;

      // User 1 creates order
      const orderRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      const orderId = orderRes.body.id;

      // User 2 tries to access user 1's order
      const accessRes = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(accessRes.status).toBe(404);
    });

    it('should handle order cancellation', async () => {
      // Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      const token = registerRes.body.access_token;

      // Create order
      const orderRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      const orderId = orderRes.body.id;

      // Cancel order
      const cancelRes = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.status).toBe('CANCELLED');
    });

    it('should handle invalid credentials on login', async () => {
      // Register
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      // Try to login with wrong password
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword!',
        });

      expect(loginRes.status).toBe(401);
    });

    it('should handle duplicate email registration', async () => {
      // Register first user
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'User 1',
        });

      // Try to register with same email
      const duplicateRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password456!',
          name: 'User 2',
        });

      expect(duplicateRes.status).toBe(409);
    });

    it('should update user profile', async () => {
      // Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      const token = registerRes.body.access_token;

      // Update profile
      const updateRes = await request(app.getHttpServer())
        .put('/api/v1/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          phone: '+1234567890',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.name).toBe('Updated Name');
      expect(updateRes.body.phone).toBe('+1234567890');
    });
  });

  describe('Error Handling in Workflows', () => {
    it('should handle missing required fields', async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          // missing password and name
        });

      expect(registerRes.status).toBe(400);
    });

    it('should handle invalid email format', async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(registerRes.status).toBe(400);
    });

    it('should handle non-existent resources', async () => {
      // Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      const token = registerRes.body.access_token;

      // Try to get non-existent order
      const orderRes = await request(app.getHttpServer())
        .get('/api/v1/orders/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(orderRes.status).toBe(404);
    });

    it('should handle expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(profileRes.status).toBe(401);
    });
  });

  describe('Response Format Validation', () => {
    it('should return proper response structure for user', async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(registerRes.body).toHaveProperty('access_token');
      expect(registerRes.body).toHaveProperty('user');
      expect(registerRes.body.user).toHaveProperty('id');
      expect(registerRes.body.user).toHaveProperty('email');
      expect(registerRes.body.user).toHaveProperty('name');
    });

    it('should return proper response structure for order', async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      const token = registerRes.body.access_token;

      const orderRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packageId: 'pkg-1',
          providerId: 'provider-1',
          paymentMethod: 'card',
        });

      expect(orderRes.body).toHaveProperty('id');
      expect(orderRes.body).toHaveProperty('userId');
      expect(orderRes.body).toHaveProperty('packageId');
      expect(orderRes.body).toHaveProperty('status');
      expect(orderRes.body).toHaveProperty('paymentAmount');
    });

    it('should not expose sensitive data in responses', async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      const token = registerRes.body.access_token;

      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.body).not.toHaveProperty('password');
    });
  });
});
