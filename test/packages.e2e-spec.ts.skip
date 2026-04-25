import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('PackagesController (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/api/v1/packages (GET) - should return 401 without auth', () => {
        return request(app.getHttpServer())
            .get('/api/v1/packages')
            .expect(401);
    });

    // Note: For full testing we need to mock AuthGuard or provide a valid JWT.
    // Since we haven't implemented a test JWT generator in this phase, we'll verify the protection.
    // If we had a mock auth strategy, we could test 200 OK.
    // Let's at least test validation rejection if we could bypass auth (or mock guard).
});
