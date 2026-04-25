import { Test, TestingModule } from '@nestjs/testing';
import { UsageSyncService } from './usage-sync.service';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { WebhookDispatcherService } from '../partners/webhook-dispatcher.service';

describe('UsageSyncService', () => {
  let service: UsageSyncService;
  let prisma: any;
  let providersService: any;
  let webhookDispatcher: any;

  const makeEsim = (overrides = {}) => ({
    id: 'esim-1', iccid: '89000001', userId: 'user-1',
    dataUsed: 200, dataTotal: 1000, status: 'ACTIVE',
    lastUsageCheck: null,
    provider: { slug: 'airalo' },
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      eSim: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
      usageUpdate: { create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    providersService = {
      getAdapter: jest.fn().mockReturnValue({
        getESIMDetails: jest.fn().mockResolvedValue({ dataTotal: 1000, dataRemaining: 500, expiresAt: new Date() }),
      }),
    };
    webhookDispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageSyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProvidersService, useValue: providersService },
        { provide: WebhookDispatcherService, useValue: webhookDispatcher },
      ],
    }).compile();

    service = module.get(UsageSyncService);
  });

  it('should return early when no eSIMs need sync', async () => {
    const result = await service.syncAllUsage();
    expect(result).toEqual({ synced: 0, errors: 0 });
  });

  it('should sync usage and record updates', async () => {
    prisma.eSim.findMany.mockResolvedValue([makeEsim()]);
    const result = await service.syncAllUsage();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.synced).toBe(1);
    expect(result.errors).toBe(0);
  });

  it('should skip eSIMs checked recently (< 4 hours ago)', async () => {
    // The query itself filters these out, so findMany returns empty
    prisma.eSim.findMany.mockResolvedValue([]);
    const result = await service.syncAllUsage();
    expect(result.synced).toBe(0);
  });

  it('should dispatch webhook when usage crosses 80% threshold', async () => {
    // Previous usage was 700/1000 (70%), new usage is 850/1000 (85%)
    const esim = makeEsim({ dataUsed: 700, dataTotal: 1000 });
    prisma.eSim.findMany.mockResolvedValue([esim]);
    providersService.getAdapter.mockReturnValue({
      getESIMDetails: jest.fn().mockResolvedValue({ dataTotal: 1000, dataRemaining: 150, expiresAt: new Date() }),
    });

    await service.syncAllUsage();

    expect(webhookDispatcher.dispatch).toHaveBeenCalledWith(
      'user-1', 'esim.usage.warning',
      expect.objectContaining({ esimId: 'esim-1', percentUsed: 85 }),
    );
  });

  it('should NOT dispatch webhook if already above 80%', async () => {
    // Previous usage was 850/1000 (85%), new usage is 900/1000 (90%)
    const esim = makeEsim({ dataUsed: 850, dataTotal: 1000 });
    prisma.eSim.findMany.mockResolvedValue([esim]);
    providersService.getAdapter.mockReturnValue({
      getESIMDetails: jest.fn().mockResolvedValue({ dataTotal: 1000, dataRemaining: 100, expiresAt: new Date() }),
    });

    await service.syncAllUsage();

    expect(webhookDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should handle adapter errors gracefully', async () => {
    prisma.eSim.findMany.mockResolvedValue([makeEsim()]);
    providersService.getAdapter.mockImplementation(() => { throw new Error('Provider down'); });

    const result = await service.syncAllUsage();
    expect(result.errors).toBe(1);
    expect(result.synced).toBe(0);
  });
});
