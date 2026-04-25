import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    
    await app.init();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Clean up test data
    await prismaService.user.deleteMany({
      where: { email: { contains: 'test-' } },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        email: 'test-user@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(registerDto.email);
          expect(res.body.name).toBe(registerDto.name);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should reject registration with invalid email', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with weak password', () => {
      const registerDto = {
        email: 'test-weak@example.com',
        password: 'weak',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with duplicate email', async () => {
      const registerDto = {
        email: 'test-duplicate@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with missing fields', () => {
      const registerDto = {
        email: 'test-missing@example.com',
        // password missing
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      // Create a test user
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test-login@example.com',
          password: 'TestPassword123!',
          name: 'Test User',
        });
    });

    it('should login successfully with correct credentials', () => {
      const loginDto = {
        email: 'test-login@example.com',
        password: 'TestPassword123!',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(typeof res.body.access_token).toBe('string');
        });
    });

    it('should reject login with incorrect password', () => {
      const loginDto = {
        email: 'test-login@example.com',
        password: 'WrongPassword123!',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with non-existent email', () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with missing credentials', () => {
      const loginDto = {
        email: 'test-login@example.com',
        // password missing
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(400);
    });
  });

  describe('JWT Token Validation', () => {
    let validToken: string;

    beforeAll(async () => {
      // Register and login to get token
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test-token@example.com',
          password: 'TestPassword123!',
          name: 'Test User',
        });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test-token@example.com',
          password: 'TestPassword123!',
        });

      validToken = loginRes.body.access_token;
    });

    it('should access protected endpoint with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('should reject access without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .expect(401);
    });

    it('should reject access with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should reject access with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });
});
