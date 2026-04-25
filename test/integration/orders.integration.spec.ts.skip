import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/config/prisma.service';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { ProvidersService } from '../../src/modules/providers/providers.service';
import { OrderStatus } from '@prisma/client';
import { setupIntegrationTest, teardownIntegrationTest, cleanupDatabase, testData } from './setup';

describe('Orders Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let ordersService: OrdersService;
  let providersService: ProvidersService;
  let testUserId: string;

  beforeAll(async () => {
    const setup = await setupIntegrationTest();
    app = setup.app;
    prismaService = setup.prismaService;
    ordersService = app.get<OrdersService>(OrdersService);
    providersService = app.get<ProvidersService>(ProvidersService);
  });

  afterAll(async () => {
    await teardownIntegrationTest();
  });

  beforeEach(async () => {
    await cleanupDatabase(prismaService);

    // Create test user
    const user = await prismaService.user.create({
      data: testData.user,
    });
    testUserId = user.id;
  });

  describe('Order Creation Workflow', () => {
    it('should create order successfully', async () => {
      const order = await ordersService.createOrder(testUserId, testData.order);

      expect(order).toBeDefined();
      expect(order.userId).toBe(testUserId);
      expect(order.packageId).toBe(testData.order.packageId);
      expect(order.status).toBe(OrderStatus.PROCESSING);
    });

    it('should persist order in database', async () => {
      const order = await ordersService.createOrder(testUserId, testData.order);

      const dbOrder = await prismaService.order.findUnique({
        where: { id: order.id },
      });

      expect(dbOrder).toBeDefined();
      expect(dbOrder.userId).toBe(testUserId);
      expect(dbOrder.paymentAmount).toBe(testData.package.price);
    });

    it('should create eSIM when order is created', async () => {
      const order = await ordersService.createOrder(testUserId, testData.order);

      const esim = await prismaService.eSim.findFirst({
        where: { orderId: order.id },
      });

      expect(esim).toBeDefined();
      expect(esim.userId).toBe(testUserId);
      expect(esim.status).toBe('INACTIVE');
    });

    it('should set correct payment information', async () => {
      const order = await ordersService.createOrder(testUserId, testData.order);

      expect(order.paymentAmount).toBe(testData.package.price);
      expect(order.paymentCurrency).toBe(testData.package.currency);
      expect(order.paymentMethod).toBe(testData.order.paymentMethod);
    });
  });

  describe('Order Retrieval', () => {
    it('should retrieve user orders', async () => {
      await ordersService.createOrder(testUserId, testData.order);
      await ordersService.createOrder(testUserId, testData.order);

      const orders = await ordersService.getUserOrders(testUserId);

      expect(orders).toHaveLength(2);
      expect(orders[0].userId).toBe(testUserId);
    });

    it('should retrieve order by id', async () => {
      const createdOrder = await ordersService.createOrder(testUserId, testData.order);

      const order = await ordersService.getOrderById(createdOrder.id, testUserId);

      expect(order).toBeDefined();
      expect(order.id).toBe(createdOrder.id);
      expect(order.userId).toBe(testUserId);
    });

    it('should include related data in order', async () => {
      const order = await ordersService.createOrder(testUserId, testData.order);

      const retrieved = await ordersService.getOrderById(order.id, testUserId);

      expect(retrieved).toHaveProperty('package');
      expect(retrieved).toHaveProperty('provider');
      expect(retrieved).toHaveProperty('esim');
    });

    it('should prevent unauthorized access to orders', async () => {
      const order = await ordersService.createOrder(testUserId, testData.order);

      const otherUserId = 'other-user-id';

      await expect(ordersService.getOrderById(order.id, otherUserId)).rejects.toThrow();
    });
  });

  describe('Order Cancellation', () => {
    it('should cancel pending order', async () => {
      const order = await ordersService.createOrder(testUserId, testData.order);

      // Create a pending order for cancellation test
      const pendingOrder = await prismaService.order.create({
        data: {
          userId: testUserId,
          packageId: testData.order.packageId,
          providerId: testData.order.providerId,
          paymentAmount: testData.package.price,
          paymentCurrency: testData.package.currency,
          paymentMethod: testData.order.paymentMethod,
          status: OrderStatus.PENDING,
        },
      });

      const cancelled = await ordersService.cancelOrder(pendingOrder.id, testUserId);

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    });

    it('should prevent cancelling completed order', async () => {
      const completedOrder = await prismaService.order.create({
        data: {
          userId: testUserId,
          packageId: testData.order.packageId,
          providerId: testData.order.providerId,
          paymentAmount: testData.package.price,
          paymentCurrency: testData.package.currency,
          paymentMethod: testData.order.paymentMethod,
          status: OrderStatus.COMPLETED,
        },
      });

      await expect(ordersService.cancelOrder(completedOrder.id, testUserId)).rejects.toThrow();
    });

    it('should update order status in database', async () => {
      const pendingOrder = await prismaService.order.create({
        data: {
          userId: testUserId,
          packageId: testData.order.packageId,
          providerId: testData.order.providerId,
          paymentAmount: testData.package.price,
          paymentCurrency: testData.package.currency,
          paymentMethod: testData.order.paymentMethod,
          status: OrderStatus.PENDING,
        },
      });

      await ordersService.cancelOrder(pendingOrder.id, testUserId);

      const dbOrder = await prismaService.order.findUnique({
        where: { id: pendingOrder.id },
      });

      expect(dbOrder.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('Order Data Consistency', () => {
    it('should maintain data consistency across services', async () => {
      const order = await ordersService.createOrder(testUserId, testData.order);

      const dbOrder = await prismaService.order.findUnique({
        where: { id: order.id },
        include: { esim: true },
      });

      expect(dbOrder.userId).toBe(order.userId);
      expect(dbOrder.packageId).toBe(order.packageId);
      expect(dbOrder.esim).toBeDefined();
    });

    it('should handle concurrent order creation', async () => {
      const promises = [
        ordersService.createOrder(testUserId, testData.order),
        ordersService.createOrder(testUserId, testData.order),
        ordersService.createOrder(testUserId, testData.order),
      ];

      const orders = await Promise.all(promises);

      expect(orders).toHaveLength(3);
      expect(orders.every(o => o.userId === testUserId)).toBe(true);

      const dbOrders = await prismaService.order.findMany({
        where: { userId: testUserId },
      });

      expect(dbOrders).toHaveLength(3);
    });

    it('should maintain referential integrity', async () => {
      const order = await ordersService.createOrder(testUserId, testData.order);

      const esim = await prismaService.eSim.findFirst({
        where: { orderId: order.id },
      });

      expect(esim.orderId).toBe(order.id);
      expect(esim.userId).toBe(order.userId);
    });
  });

  describe('Order Error Recovery', () => {
    it('should handle order retrieval for non-existent order', async () => {
      await expect(ordersService.getOrderById('nonexistent', testUserId)).rejects.toThrow();
    });

    it('should handle order cancellation for non-existent order', async () => {
      await expect(ordersService.cancelOrder('nonexistent', testUserId)).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      // This would require mocking database errors
      // For now, we test that the service handles missing data
      const orders = await ordersService.getUserOrders('nonexistent-user');

      expect(orders).toEqual([]);
    });
  });

  describe('Order Filtering and Sorting', () => {
    it('should return orders sorted by creation date', async () => {
      const order1 = await ordersService.createOrder(testUserId, testData.order);
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const order2 = await ordersService.createOrder(testUserId, testData.order);

      const orders = await ordersService.getUserOrders(testUserId);

      expect(orders[0].id).toBe(order2.id);
      expect(orders[1].id).toBe(order1.id);
    });

    it('should return empty array for user with no orders', async () => {
      const orders = await ordersService.getUserOrders(testUserId);

      expect(orders).toEqual([]);
    });
  });
});
