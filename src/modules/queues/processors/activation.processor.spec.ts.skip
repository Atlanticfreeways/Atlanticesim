import { Test, TestingModule } from '@nestjs/testing';
import { ActivationProcessor } from './activation.processor';
import { ProvidersService } from '../../providers/providers.service';
import { ProviderRouterService } from '../../providers/provider-router.service';
import { PrismaService } from '../../../config/prisma.service';
import { WalletService } from '../../partners/wallet.service';
import { PartnerProfileService } from '../../partners/partner-profile.service';
import { WebhookDispatcherService } from '../../partners/webhook-dispatcher.service';
import { OrderStatus, UserRole } from '@prisma/client';

describe('ActivationProcessor', () => {
  let processor: ActivationProcessor;
  let providersService: any;
  let providerRouter: any;
  let prisma: any;
  let webhookDispatcher: any;

  const mockJob = (overrides = {}) => ({
    data: { orderId: 'ord-1', providerId: 'airalo', packageId: 'pkg-1', userEmail: 'test@example.com', userId: 'user-1' },
    attemptsMade: 0,
    opts: { attempts: 3 },
    ...overrides,
  });

  const mockProviderOrder = {
    providerOrderId: 'prov-ord-1',
    esim: { iccid: '89000001', qrCode: 'qr-url', smdpAddress: 'smdp.io', activationCode: 'ACT1', dataTotal: 1024 },
    meta: {},
  };

  beforeEach(async () => {
    const mockAdapter = {
      createOrder: jest.fn().mockResolvedValue(mockProviderOrder),
    };

    providersService = { getAdapter: jest.fn().mockReturnValue(mockAdapter) };
    providerRouter = { resolveOptimalProvider: jest.fn().mockResolvedValue('esim-go') };
    prisma = {
      order: { update: jest.fn().mockResolvedValue({ user: { role: UserRole.END_USER } }) },
      eSim: { create: jest.fn() },
      $transaction: jest.fn(async (cb) => cb({
        order: { update: jest.fn() },
        eSim: { create: jest.fn() },
      })),
    };
    webhookDispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivationProcessor,
        { provide: ProvidersService, useValue: providersService },
        { provide: ProviderRouterService, useValue: providerRouter },
        { provide: PrismaService, useValue: prisma },
        { provide: WalletService, useValue: { deductForOrder: jest.fn() } },
        { provide: PartnerProfileService, useValue: { calculateWholesalePrice: jest.fn() } },
        { provide: WebhookDispatcherService, useValue: webhookDispatcher },
      ],
    }).compile();

    processor = module.get(ActivationProcessor);
  });

  it('should activate via primary provider successfully', async () => {
    await processor.handleActivation(mockJob() as any);

    expect(providersService.getAdapter).toHaveBeenCalledWith('airalo');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(webhookDispatcher.dispatch).toHaveBeenCalledWith('user-1', 'order.completed', expect.any(Object));
  });

  it('should fallback to alternate provider when primary fails', async () => {
    const failAdapter = { createOrder: jest.fn().mockRejectedValue(new Error('Primary down')) };
    const fallbackAdapter = { createOrder: jest.fn().mockResolvedValue(mockProviderOrder) };

    providersService.getAdapter
      .mockReturnValueOnce(failAdapter)   // primary
      .mockReturnValueOnce(fallbackAdapter); // fallback

    await processor.handleActivation(mockJob() as any);

    expect(providerRouter.resolveOptimalProvider).toHaveBeenCalledWith(undefined, undefined, ['airalo']);
    expect(fallbackAdapter.createOrder).toHaveBeenCalled();
  });

  it('should mark order FAILED when both primary and fallback fail on final attempt', async () => {
    const failAdapter = { createOrder: jest.fn().mockRejectedValue(new Error('down')) };
    providersService.getAdapter.mockReturnValue(failAdapter);
    providerRouter.resolveOptimalProvider.mockRejectedValue(new Error('No providers'));

    const job = mockJob({ attemptsMade: 2 }); // final attempt

    await expect(processor.handleActivation(job as any)).rejects.toThrow();
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.FAILED }) }),
    );
    expect(webhookDispatcher.dispatch).toHaveBeenCalledWith('user-1', 'order.failed', expect.any(Object));
  });

  it('should re-throw error to trigger Bull retry on non-final attempt', async () => {
    const failAdapter = { createOrder: jest.fn().mockRejectedValue(new Error('down')) };
    providersService.getAdapter.mockReturnValue(failAdapter);
    providerRouter.resolveOptimalProvider.mockRejectedValue(new Error('No providers'));

    const job = mockJob({ attemptsMade: 0 }); // not final

    await expect(processor.handleActivation(job as any)).rejects.toThrow('down');
  });
});
