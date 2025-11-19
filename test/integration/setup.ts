import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/config/prisma.service';

let app: INestApplication;
let prismaService: PrismaService;

export async function setupIntegrationTest(): Promise<{
  app: INestApplication;
  prismaService: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  prismaService = moduleFixture.get<PrismaService>(PrismaService);
  await prismaService.$connect();

  return { app, prismaService };
}

export async function teardownIntegrationTest(): Promise<void> {
  if (prismaService) {
    await prismaService.$disconnect();
  }
  if (app) {
    await app.close();
  }
}

export async function cleanupDatabase(prismaService: PrismaService): Promise<void> {
  // Clean up in reverse order of dependencies
  await prismaService.eSim.deleteMany({});
  await prismaService.order.deleteMany({});
  await prismaService.user.deleteMany({});
}

export const testData = {
  user: {
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    phone: '+1234567890',
    role: 'END_USER',
  },
  package: {
    id: 'pkg-1',
    name: '10GB Plan',
    dataAmount: 10,
    dataUnit: 'GB',
    price: 29.99,
    currency: 'USD',
    validity: 30,
    validityUnit: 'days',
  },
  order: {
    packageId: 'pkg-1',
    providerId: 'provider-1',
    paymentMethod: 'card',
  },
};
