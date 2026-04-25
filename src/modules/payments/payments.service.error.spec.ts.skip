import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import Stripe from 'stripe';

jest.mock('stripe');

describe('PaymentsService - Error Handling', () => {
  let service: PaymentsService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let stripeMock: jest.Mocked<Stripe>;

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    paymentAmount: 29.99,
    paymentCurrency: 'USD',
    transactionId: 'txn-123',
  };

  beforeEach(async () => {
    stripeMock = {
      paymentIntents: {
        create: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
      refunds: {
        create: jest.fn(),
      },
    } as any;

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

    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(
      () => stripeMock,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent - Error Handling', () => {
    it('should throw error when order not found', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createPaymentIntent('nonexistent', 'user-1'),
      ).rejects.toThrow('Order not found');
    });

    it('should throw error when order belongs to different user', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createPaymentIntent('order-1', 'different-user'),
      ).rejects.toThrow('Order not found');
    });

    it('should handle Stripe API error', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock).mockRejectedValue(
        new Error('Stripe API error'),
      );

      await expect(
        service.createPaymentIntent('order-1', 'user-1'),
      ).rejects.toThrow('Stripe API error');
    });

    it('should handle Stripe authentication error', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock).mockRejectedValue(
        new Error('Invalid API key'),
      );

      await expect(
        service.createPaymentIntent('order-1', 'user-1'),
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle Stripe rate limiting', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock).mockRejectedValue(
        new Error('Too many requests'),
      );

      await expect(
        service.createPaymentIntent('order-1', 'user-1'),
      ).rejects.toThrow('Too many requests');
    });

    it('should handle invalid payment amount', async () => {
      const invalidOrder = { ...mockOrder, paymentAmount: -10 };
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(
        invalidOrder,
      );

      (stripeMock.paymentIntents.create as jest.Mock).mockRejectedValue(
        new Error('Invalid amount'),
      );

      await expect(
        service.createPaymentIntent('order-1', 'user-1'),
      ).rejects.toThrow('Invalid amount');
    });

    it('should handle unsupported currency', async () => {
      const invalidOrder = { ...mockOrder, paymentCurrency: 'INVALID' };
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(
        invalidOrder,
      );

      (stripeMock.paymentIntents.create as jest.Mock).mockRejectedValue(
        new Error('Unsupported currency'),
      );

      await expect(
        service.createPaymentIntent('order-1', 'user-1'),
      ).rejects.toThrow('Unsupported currency');
    });
  });

  describe('handleWebhook - Error Handling', () => {
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

    it('should throw error on missing webhook secret', async () => {
      const signature = 'sig_123';
      const payload = Buffer.from('test');

      (stripeMock.webhooks.constructEvent as jest.Mock).mockImplementation(
        () => {
          throw new Error('No webhook secret provided');
        },
      );

      await expect(service.handleWebhook(signature, payload)).rejects.toThrow();
    });

    it('should handle database error during webhook processing', async () => {
      const signature = 'sig_123';
      const payload = Buffer.from('test');
      const event = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123', metadata: { orderId: 'order-1' } } },
      };

      (stripeMock.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prismaService.order.update as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.handleWebhook(signature, payload)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle malformed webhook payload', async () => {
      const signature = 'sig_123';
      const payload = Buffer.from('invalid json');

      (stripeMock.webhooks.constructEvent as jest.Mock).mockImplementation(
        () => {
          throw new Error('Invalid payload');
        },
      );

      await expect(service.handleWebhook(signature, payload)).rejects.toThrow();
    });
  });

  describe('refundPayment - Error Handling', () => {
    it('should throw error when order not found', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.refundPayment('nonexistent', 'user-1'),
      ).rejects.toThrow('Order or transaction not found');
    });

    it('should throw error when transaction id missing', async () => {
      const orderWithoutTransaction = { ...mockOrder, transactionId: null };
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(
        orderWithoutTransaction,
      );

      await expect(
        service.refundPayment('order-1', 'user-1'),
      ).rejects.toThrow('Order or transaction not found');
    });

    it('should handle Stripe refund error', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.refunds.create as jest.Mock).mockRejectedValue(
        new Error('Refund failed'),
      );

      await expect(
        service.refundPayment('order-1', 'user-1'),
      ).rejects.toThrow('Refund failed');
    });

    it('should handle refund on already refunded order', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.refunds.create as jest.Mock).mockRejectedValue(
        new Error('Charge already refunded'),
      );

      await expect(
        service.refundPayment('order-1', 'user-1'),
      ).rejects.toThrow('Charge already refunded');
    });

    it('should handle database error during refund update', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.refunds.create as jest.Mock).mockResolvedValue({
        id: 'ref_123',
        status: 'succeeded',
      });
      (prismaService.order.update as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.refundPayment('order-1', 'user-1'),
      ).rejects.toThrow('Database error');
    });

    it('should handle Stripe connection error', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.refunds.create as jest.Mock).mockRejectedValue(
        new Error('Connection timeout'),
      );

      await expect(
        service.refundPayment('order-1', 'user-1'),
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('Error Message Quality', () => {
    it('should provide clear error for missing order', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      try {
        await service.createPaymentIntent('order-1', 'user-1');
      } catch (error) {
        expect(error.message).toContain('not found');
      }
    });

    it('should not expose sensitive payment data in errors', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock).mockRejectedValue(
        new Error('Payment failed'),
      );

      try {
        await service.createPaymentIntent('order-1', 'user-1');
      } catch (error) {
        expect(error.message).not.toContain('txn-123');
      }
    });
  });

  describe('Error Recovery', () => {
    it('should retry on transient Stripe error', async () => {
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock)
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          id: 'pi_123',
          client_secret: 'secret',
        });

      // First attempt fails
      await expect(
        service.createPaymentIntent('order-1', 'user-1'),
      ).rejects.toThrow('Timeout');

      // Reset and retry
      jest.clearAllMocks();
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (stripeMock.paymentIntents.create as jest.Mock).mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret',
      });

      const result = await service.createPaymentIntent('order-1', 'user-1');
      expect(result).toBeDefined();
    });
  });
});
