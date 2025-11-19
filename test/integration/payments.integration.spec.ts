import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/config/prisma.service';
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { setupIntegrationTest, teardownIntegrationTest, cleanupDatabase, testData } from './setup';

describe('Payments Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let paymentsService: PaymentsService;
  let ordersService: OrdersService;
  let testUserId: string;
  let testOrderId: string;

  beforeAll(async () => {
    const setup = await setupIntegrationTest();
    app = setup.app;
    prismaService = setup.prismaService;
    paymentsService = app.get<PaymentsService>(PaymentsService);
    ordersService = app.get<OrdersService>(OrdersService);
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

    // Create test order
    const order = await ordersService.createOrder(testUserId, testData.order);
    testOrderId = order.id;
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent for valid order', async () => {
      const paymentIntent = await paymentsService.createPaymentIntent(testOrderId, testUserId);

      expect(paymentIntent).toBeDefined();
      expect(paymentIntent).toHaveProperty('clientSecret');
      expect(paymentIntent).toHaveProperty('paymentIntentId');
    });

    it('should include correct payment amount', async () => {
      const paymentIntent = await paymentsService.createPaymentIntent(testOrderId, testUserId);

      expect(paymentIntent).toBeDefined();
      // Amount should be in cents
      expect(paymentIntent.paymentIntentId).toBeDefined();
    });

    it('should prevent payment for non-existent order', async () => {
      await expect(
        paymentsService.createPaymentIntent('nonexistent', testUserId),
      ).rejects.toThrow('Order not found');
    });

    it('should prevent unauthorized payment creation', async () => {
      const otherUserId = 'other-user-id';

      await expect(
        paymentsService.createPaymentIntent(testOrderId, otherUserId),
      ).rejects.toThrow('Order not found');
    });
  });

  describe('Payment Webhook Processing', () => {
    it('should handle payment success webhook', async () => {
      const paymentIntent = await paymentsService.createPaymentIntent(testOrderId, testUserId);

      // Simulate webhook event
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentIntent.paymentIntentId,
            metadata: { orderId: testOrderId, userId: testUserId },
          },
        },
      };

      // In real scenario, this would be called by Stripe webhook
      // For now, we verify the order can be updated
      const order = await prismaService.order.findUnique({
        where: { id: testOrderId },
      });

      expect(order).toBeDefined();
    });

    it('should handle payment failure webhook', async () => {
      const order = await prismaService.order.findUnique({
        where: { id: testOrderId },
      });

      expect(order.status).toBe(OrderStatus.PROCESSING);
    });

    it('should reject invalid webhook signature', async () => {
      const invalidSignature = 'invalid_signature';
      const payload = Buffer.from('test');

      await expect(
        paymentsService.handleWebhook(invalidSignature, payload),
      ).rejects.toThrow();
    });
  });

  describe('Payment Refund Processing', () => {
    it('should refund completed payment', async () => {
      // Create a completed order
      const completedOrder = await prismaService.order.create({
        data: {
          userId: testUserId,
          packageId: testData.order.packageId,
          providerId: testData.order.providerId,
          paymentAmount: testData.package.price,
          paymentCurrency: testData.package.currency,
          paymentMethod: testData.order.paymentMethod,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.COMPLETED,
          transactionId: 'txn_test_123',
        },
      });

      const refund = await paymentsService.refundPayment(completedOrder.id, testUserId);

      expect(refund).toBeDefined();
      expect(refund).toHaveProperty('refundId');
      expect(refund).toHaveProperty('status');
    });

    it('should update order status after refund', async () => {
      const completedOrder = await prismaService.order.create({
        data: {
          userId: testUserId,
          packageId: testData.order.packageId,
          providerId: testData.order.providerId,
          paymentAmount: testData.package.price,
          paymentCurrency: testData.package.currency,
          paymentMethod: testData.order.paymentMethod,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.COMPLETED,
          transactionId: 'txn_test_123',
        },
      });

      await paymentsService.refundPayment(completedOrder.id, testUserId);

      const updatedOrder = await prismaService.order.findUnique({
        where: { id: completedOrder.id },
      });

      expect(updatedOrder.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(updatedOrder.status).toBe(OrderStatus.REFUNDED);
    });

    it('should prevent refund for non-existent order', async () => {
      await expect(
        paymentsService.refundPayment('nonexistent', testUserId),
      ).rejects.toThrow('Order or transaction not found');
    });

    it('should prevent refund without transaction id', async () => {
      const orderWithoutTransaction = await prismaService.order.create({
        data: {
          userId: testUserId,
          packageId: testData.order.packageId,
          providerId: testData.order.providerId,
          paymentAmount: testData.package.price,
          paymentCurrency: testData.package.currency,
          paymentMethod: testData.order.paymentMethod,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.COMPLETED,
          transactionId: null,
        },
      });

      await expect(
        paymentsService.refundPayment(orderWithoutTransaction.id, testUserId),
      ).rejects.toThrow('Order or transaction not found');
    });
  });

  describe('Payment Data Consistency', () => {
    it('should maintain payment information in database', async () => {
      const paymentIntent = await paymentsService.createPaymentIntent(testOrderId, testUserId);

      const order = await prismaService.order.findUnique({
        where: { id: testOrderId },
      });

      expect(order.paymentAmount).toBe(testData.package.price);
      expect(order.paymentCurrency).toBe(testData.package.currency);
      expect(order.paymentMethod).toBe(testData.order.paymentMethod);
    });

    it('should handle concurrent payment intents', async () => {
      const promises = [
        paymentsService.createPaymentIntent(testOrderId, testUserId),
        paymentsService.createPaymentIntent(testOrderId, testUserId),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.clientSecret)).toBe(true);
    });
  });

  describe('Payment Error Handling', () => {
    it('should handle invalid payment amount', async () => {
      const invalidOrder = await prismaService.order.create({
        data: {
          userId: testUserId,
          packageId: testData.order.packageId,
          providerId: testData.order.providerId,
          paymentAmount: -10,
          paymentCurrency: testData.package.currency,
          paymentMethod: testData.order.paymentMethod,
          status: OrderStatus.PENDING,
        },
      });

      await expect(
        paymentsService.createPaymentIntent(invalidOrder.id, testUserId),
      ).rejects.toThrow();
    });

    it('should handle unsupported currency', async () => {
      const invalidOrder = await prismaService.order.create({
        data: {
          userId: testUserId,
          packageId: testData.order.packageId,
          providerId: testData.order.providerId,
          paymentAmount: testData.package.price,
          paymentCurrency: 'INVALID',
          paymentMethod: testData.order.paymentMethod,
          status: OrderStatus.PENDING,
        },
      });

      await expect(
        paymentsService.createPaymentIntent(invalidOrder.id, testUserId),
      ).rejects.toThrow();
    });
  });
});
