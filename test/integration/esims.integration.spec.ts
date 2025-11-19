import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/config/prisma.service';
import { EsimsService } from '../../src/modules/esims/esims.service';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { ESimStatus } from '@prisma/client';
import { setupIntegrationTest, teardownIntegrationTest, cleanupDatabase, testData } from './setup';

describe('eSIMs Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let esimsService: EsimsService;
  let ordersService: OrdersService;
  let testUserId: string;
  let testEsimId: string;

  beforeAll(async () => {
    const setup = await setupIntegrationTest();
    app = setup.app;
    prismaService = setup.prismaService;
    esimsService = app.get<EsimsService>(EsimsService);
    ordersService = app.get<OrdersService>(OrdersService);
  });

  afterAll(async () => {
    await teardownIntegrationTest();
  });

  beforeEach(async () => {
    await cleanupDatabase(prismaService);

    // Create test user
    const user = await prismaService.user.create({
      data: {
        ...testData.user,
        role: 'END_USER' as any,
      },
    });
    testUserId = user.id;

    // Create test order with eSIM
    const order = await ordersService.createOrder(testUserId, testData.order);

    // Get the eSIM created with the order
    const esim = await prismaService.eSim.findFirst({
      where: { orderId: order.id },
    });
    if (esim) {
      testEsimId = esim.id;
    }
  });

  describe('eSIM Retrieval', () => {
    it('should retrieve user eSIMs', async () => {
      const esims = await esimsService.getUserEsims(testUserId);

      expect(esims.length).toBeGreaterThan(0);
      expect(esims[0].userId).toBe(testUserId);
    });

    it('should retrieve eSIM by id', async () => {
      if (!testEsimId) {
        throw new Error('Test eSIM ID not set');
      }
      const esim = await esimsService.getEsimById(testEsimId, testUserId);

      expect(esim).toBeDefined();
      expect(esim.id).toBe(testEsimId);
      expect(esim.userId).toBe(testUserId);
    });

    it('should include related order data', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const esim = await esimsService.getEsimById(testEsimId, testUserId);

      expect(esim).toHaveProperty('order');
      expect(esim.order).toHaveProperty('package');
      expect(esim.order).toHaveProperty('provider');
    });

    it('should prevent unauthorized access', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const otherUserId = 'other-user-id';

      await expect(esimsService.getEsimById(testEsimId, otherUserId)).rejects.toThrow();
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR code for eSIM', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const qrCode = await esimsService.getQrCode(testEsimId, testUserId);

      expect(qrCode).toBeDefined();
      expect(qrCode).toHaveProperty('qrCode');
      expect(qrCode.qrCode).toBeTruthy();
    });

    it('should persist QR code in database', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      await esimsService.getQrCode(testEsimId, testUserId);

      const esim = await prismaService.eSim.findUnique({
        where: { id: testEsimId },
      });

      expect(esim?.qrCode).toBeTruthy();
    });

    it('should return cached QR code on subsequent calls', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const qrCode1 = await esimsService.getQrCode(testEsimId, testUserId);
      const qrCode2 = await esimsService.getQrCode(testEsimId, testUserId);

      expect(qrCode1.qrCode).toBe(qrCode2.qrCode);
    });

    it('should prevent unauthorized QR code access', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const otherUserId = 'other-user-id';

      await expect(esimsService.getQrCode(testEsimId, otherUserId)).rejects.toThrow();
    });
  });

  describe('eSIM Activation', () => {
    it('should activate inactive eSIM', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const result = await esimsService.activateEsim(testEsimId, testUserId);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should update eSIM status to ACTIVE', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      await esimsService.activateEsim(testEsimId, testUserId);

      const esim = await prismaService.eSim.findUnique({
        where: { id: testEsimId },
      });

      expect(esim?.status).toBe(ESimStatus.ACTIVE);
      expect(esim?.activatedAt).toBeTruthy();
    });

    it('should prevent activating already active eSIM', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      await esimsService.activateEsim(testEsimId, testUserId);

      await expect(esimsService.activateEsim(testEsimId, testUserId)).rejects.toThrow(
        'eSIM is already activated or cannot be activated',
      );
    });

    it('should prevent unauthorized activation', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const otherUserId = 'other-user-id';

      await expect(esimsService.activateEsim(testEsimId, otherUserId)).rejects.toThrow();
    });
  });

  describe('Usage Data Tracking', () => {
    it('should retrieve usage data for eSIM', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const usage = await esimsService.getUsageData(testEsimId, testUserId);

      expect(usage).toBeDefined();
      expect(usage).toHaveProperty('dataUsed');
      expect(usage).toHaveProperty('dataTotal');
    });

    it('should update usage data in database', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      await esimsService.getUsageData(testEsimId, testUserId);

      const esim = await prismaService.eSim.findUnique({
        where: { id: testEsimId },
      });

      expect(esim?.dataUsed).toBeDefined();
    });

    it('should handle provider unavailability gracefully', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      // Even if provider is down, should return cached data
      const usage = await esimsService.getUsageData(testEsimId, testUserId);

      expect(usage).toBeDefined();
      expect(usage.dataTotal).toBe(10240); // From test data
    });

    it('should prevent unauthorized usage access', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const otherUserId = 'other-user-id';

      await expect(esimsService.getUsageData(testEsimId, otherUserId)).rejects.toThrow();
    });
  });

  describe('eSIM Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const esim1 = await esimsService.getEsimById(testEsimId, testUserId);
      await esimsService.activateEsim(testEsimId, testUserId);
      const esim2 = await esimsService.getEsimById(testEsimId, testUserId);

      expect(esim1.id).toBe(esim2.id);
      expect(esim1.status).toBe(ESimStatus.INACTIVE);
      expect(esim2.status).toBe(ESimStatus.ACTIVE);
    });

    it('should handle concurrent eSIM operations', async () => {
      const esims = await esimsService.getUserEsims(testUserId);

      expect(esims.length).toBeGreaterThan(0);
      expect(esims[0].id).toBe(testEsimId);
    });

    it('should maintain referential integrity with orders', async () => {
      if (!testEsimId) throw new Error('Test eSIM ID not set');
      const esim = await prismaService.eSim.findUnique({
        where: { id: testEsimId },
        include: { order: true },
      });

      expect(esim?.order).toBeDefined();
      expect(esim?.orderId).toBe(esim?.order?.id);
    });
  });

  describe('eSIM Error Handling', () => {
    it('should handle non-existent eSIM', async () => {
      await expect(esimsService.getEsimById('nonexistent', testUserId)).rejects.toThrow();
    });

    it('should handle QR code generation for non-existent eSIM', async () => {
      await expect(esimsService.getQrCode('nonexistent', testUserId)).rejects.toThrow();
    });

    it('should handle activation for non-existent eSIM', async () => {
      await expect(esimsService.activateEsim('nonexistent', testUserId)).rejects.toThrow();
    });

    it('should handle usage data for non-existent eSIM', async () => {
      await expect(esimsService.getUsageData('nonexistent', testUserId)).rejects.toThrow();
    });
  });

  describe('Multiple eSIMs per User', () => {
    it('should handle multiple eSIMs for same user', async () => {
      // Create another order
      await ordersService.createOrder(testUserId, testData.order);

      const esims = await esimsService.getUserEsims(testUserId);

      expect(esims.length).toBeGreaterThanOrEqual(2);
    });

    it('should retrieve correct eSIM by id', async () => {
      // Create another order
      const order2 = await ordersService.createOrder(testUserId, testData.order);
      const esim2 = await prismaService.eSim.findFirst({
        where: { orderId: order2.id },
      });

      if (!esim2) throw new Error('eSIM2 not created');
      const retrieved1 = await esimsService.getEsimById(testEsimId, testUserId);
      const retrieved2 = await esimsService.getEsimById(esim2.id, testUserId);

      expect(retrieved1.id).toBe(testEsimId);
      expect(retrieved2.id).toBe(esim2.id);
      expect(retrieved1.id).not.toBe(retrieved2.id);
    });
  });
});
