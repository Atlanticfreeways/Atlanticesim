import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../config/prisma.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import Stripe from 'stripe';

jest.mock('stripe');

describe('PaymentsService', () => {
  let service: PaymentsService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let stripeMock: jest.Mocked<Stripe>;

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    packageId: 'pkg-1',
    providerId: 'provider-1',
    paymentAmount: 29.99,
    paymentCurrency: 'USD',
    paymentMethod: 'card',
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.PENDING,
    transactionId: 'txn-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaymentIntent = {
    id: 'pi_123',
    client_secret: 'pi_123_secret',
    amount: 2999,
    currency: 'usd',
    status: 'succeeded',
    metadata: {
      orderId: 'order-1',
      userId: 'user-1',
    },
  };

  const mockRefund = {
    id: 'ref_123',
    status: 'succeeded',
    amount: 2999,
  };

  beforeEach(async () => {
    stripeMock = {
      paymentIntents: {
        create: jest.fn().mockResolvedValue(mockPaymentIntent),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
      refunds: {
        create: jest.fn().mockResolvedValue(mockRefund),
      },
    } as any;

    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(
      () => stripeMock,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                STRIPE_SECRET_KEY: 'sk_test_123',
                STRIPE_WEBHOOK_SECRET: 'whsec_123',
              };
              return config[key];
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            order: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock).mockResolvedValue(
        mockPaymentIntent,
      );

      const result = await service.createPaymentIntent(orderId, userId);

      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: { id: orderId, userId },
      });
      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2999,
        currency: 'usd',
        metadata: {
          orderId: 'order-1',
          userId: 'user-1',
        },
      });
      expect(result).toHaveProperty('clientSecret');
      expect(result).toHaveProperty('paymentIntentId');
    });

    it('should convert amount to cents', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock).mockResolvedValue(
        mockPaymentIntent,
      );

      await service.createPaymentIntent(orderId, userId);

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2999,
        }),
      );
    });

    it('should use lowercase currency', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock).mockResolvedValue(
        mockPaymentIntent,
      );

      await service.createPaymentIntent(orderId, userId);

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'usd',
        }),
      );
    });

    it('should throw error if order not found', async () => {
      const orderId = 'nonexistent';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createPaymentIntent(orderId, userId),
      ).rejects.toThrow('Order not found');
    });

    it('should include order metadata in payment intent', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock).mockResolvedValue(
        mockPaymentIntent,
      );

      await service.createPaymentIntent(orderId, userId);

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            orderId: 'order-1',
            userId: 'user-1',
          },
        }),
      );
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const signature = 'sig_123';
      const payload = Buffer.from('test');
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: mockPaymentIntent,
        },
      };

      (stripeMock.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.handleWebhook(signature, payload);

      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_123',
      );
      expect(prismaService.order.update).toHaveBeenCalled();
      expect(result).toEqual({ received: true });
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const signature = 'sig_123';
      const payload = Buffer.from('test');
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: mockPaymentIntent,
        },
      };

      (stripeMock.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.handleWebhook(signature, payload);

      expect(prismaService.order.update).toHaveBeenCalled();
      expect(result).toEqual({ received: true });
    });

    it('should update order to CONFIRMED on payment success', async () => {
      const signature = 'sig_123';
      const payload = Buffer.from('test');
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: mockPaymentIntent,
        },
      };

      (stripeMock.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);

      await service.handleWebhook(signature, payload);

      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          status: OrderStatus.CONFIRMED,
          transactionId: 'pi_123',
        },
      });
    });

    it('should update order to FAILED on payment failure', async () => {
      const signature = 'sig_123';
      const payload = Buffer.from('test');
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: mockPaymentIntent,
        },
      };

      (stripeMock.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);

      await service.handleWebhook(signature, payload);

      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          status: OrderStatus.FAILED,
        },
      });
    });

    it('should throw error on invalid webhook signature', async () => {
      const signature = 'invalid_sig';
      const payload = Buffer.from('test');

      (stripeMock.webhooks.constructEvent as jest.Mock).mockImplementation(
        () => {
          throw new Error('Signature verification failed');
        },
      );

      await expect(service.handleWebhook(signature, payload)).rejects.toThrow(
        'Webhook signature verification failed',
      );
    });

    it('should ignore unknown event types', async () => {
      const signature = 'sig_123';
      const payload = Buffer.from('test');
      const event = {
        type: 'unknown.event',
        data: {
          object: {},
        },
      };

      (stripeMock.webhooks.constructEvent as jest.Mock).mockReturnValue(event);

      const result = await service.handleWebhook(signature, payload);

      expect(result).toEqual({ received: true });
    });
  });

  describe('refundPayment', () => {
    it('should refund payment successfully', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.refunds.create as jest.Mock).mockResolvedValue(mockRefund);
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.refundPayment(orderId, userId);

      expect(stripeMock.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'txn-123',
      });
      expect(result).toHaveProperty('refundId');
      expect(result).toHaveProperty('status');
      expect(result.refundId).toBe('ref_123');
    });

    it('should update order status to REFUNDED', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.refunds.create as jest.Mock).mockResolvedValue(mockRefund);
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);

      await service.refundPayment(orderId, userId);

      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: OrderStatus.REFUNDED,
        },
      });
    });

    it('should throw error if order not found', async () => {
      const orderId = 'nonexistent';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.refundPayment(orderId, userId)).rejects.toThrow(
        'Order or transaction not found',
      );
    });

    it('should throw error if transaction id not found', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';
      const orderWithoutTransaction = { ...mockOrder, transactionId: null };

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(
        orderWithoutTransaction,
      );

      await expect(service.refundPayment(orderId, userId)).rejects.toThrow(
        'Order or transaction not found',
      );
    });

    it('should use correct payment intent for refund', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.refunds.create as jest.Mock).mockResolvedValue(mockRefund);
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);

      await service.refundPayment(orderId, userId);

      expect(stripeMock.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'txn-123',
      });
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(service.createPaymentIntent).toBeDefined();
      expect(service.handleWebhook).toBeDefined();
      expect(service.refundPayment).toBeDefined();
    });

    it('should inject ConfigService', () => {
      expect(configService).toBeDefined();
    });

    it('should inject PrismaService', () => {
      expect(prismaService).toBeDefined();
    });
  });
});
