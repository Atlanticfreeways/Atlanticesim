import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/config/prisma.service';

let app: INestApplication;
let prismaService: PrismaService;

export async function setupE2ETest(): Promise<{
  app: INestApplication;
  prismaService: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  await app.init();

  prismaService = moduleFixture.get<PrismaService>(PrismaService);
  await prismaService.$connect();

  return { app, prismaService };
}

export async function teardownE2ETest(): Promise<void> {
  if (prismaService) {
    await prismaService.$disconnect();
  }
  if (app) {
    await app.close();
  }
}

export async function cleanupDatabase(prismaService: PrismaService): Promise<void> {
  await prismaService.eSim.deleteMany({});
  await prismaService.order.deleteMany({});
  await prismaService.user.deleteMany({});
}
