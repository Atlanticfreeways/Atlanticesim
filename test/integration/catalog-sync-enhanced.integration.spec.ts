import { Test, TestingModule } from '@nestjs/testing';
import { PackageClassifierEnhanced } from '../../common/utils/package-classifier-enhanced.util';
import { ProviderHealthService } from '../providers/provider-health-enhanced.service';
import { PricingRuleService } from './pricing-rule.service';
import { CatalogSyncServiceEnhanced } from './catalog-sync-enhanced.service';
import { MonitoringService } from '../../config/monitoring-alerts.service';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';

describe('Catalog Sync Integration Tests', () => {
  let classifierEnhanced: typeof PackageClassifierEnhanced;
  let healthService: ProviderHealthService;
  let pricingRuleService: PricingRuleService;
  let syncService: CatalogSyncServiceEnhanced;
  let monitoringService: MonitoringService;

  const mockPrisma = {
    providerHealth: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    pricingRule: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    syncHistory: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    package: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    provider: {
      findUnique: jest.fn(),
    },
  };

  const mockProvidersService = {
    getAdapter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderHealthService,
        PricingRuleService,
        CatalogSyncServiceEnhanced,
        MonitoringService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ProvidersService,
          useValue: mockProvidersService,
        },
      ],
    }).compile();

    classifierEnhanced = PackageClassifierEnhanced;
    healthService = module.get<ProviderHealthService>(ProviderHealthService);
    pricingRuleService = module.get<PricingRuleService>(PricingRuleService);
    syncService = module.get<CatalogSyncServiceEnhanced>(CatalogSyncServiceEnhanced);
    monitoringService = module.get<MonitoringService>(MonitoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Sync Flow', () => {
    it('should classify, price, and sync packages', async () => {
      // Step 1: Classify a package
      const rawPackage = {
        hasData: true,
        hasVoice: true,
        hasSms: false,
        isUnlimited: false,
        countries: ['US', 'CA'],
        dataAmount: 10,
        voiceMinutes: 500,
        description: 'Package with fair usage policy. Speeds reduce after 2GB.',
        provider: 'airalo',
      };

      const classification = classifierEnhanced.classify(rawPackage);

      expect(classification.packageType).toBe('DATA_WITH_CALL');
      expect(classification.scopeType).toBe('REGIONAL');
      expect(classification.fup.detected).toBe(true);

      // Step 2: Apply pricing rules
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { country: 'US', packageType: 'DATA_WITH_CALL' },
          retailPrice: 19.99,
        },
      ]);

      const finalPrice = await pricingRuleService.applyRules(24.99, {
        country: 'US',
        packageType: 'DATA_WITH_CALL',
      });

      expect(finalPrice).toBe(19.99);

      // Step 3: Record provider health
      mockPrisma.providerHealth.upsert.mockResolvedValue({
        providerId: 'airalo',
        healthScore: 0.95,
        isDegraded: false,
      });

      await healthService.recordSuccess('airalo', 150);

      expect(mockPrisma.providerHealth.upsert).toHaveBeenCalled();
    });

    it('should handle complete sync cycle with monitoring', async () => {
      // Setup
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([
          {
            id: 'pkg-1',
            title: 'US 10GB',
            dataAmount: 10,
            dataUnit: 'GB',
            duration: 30,
            wholesalePrice: 24.99,
            currency: 'USD',
            coverage: ['US'],
            description: 'Unlimited with fair usage policy. Speeds reduce to 512 Mbps after 2GB daily usage.',
            meta: {
              voiceMinutes: 500,
              smsCount: 100,
              unlimited: false,
            },
          },
          {
            id: 'pkg-2',
            title: 'EU Regional',
            dataAmount: 5,
            dataUnit: 'GB',
            duration: 30,
            wholesalePrice: 14.99,
            currency: 'USD',
            coverage: ['DE', 'FR', 'IT'],
            description: 'Standard package',
            meta: {
              voiceMinutes: 0,
              smsCount: 0,
            },
          },
        ]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });
      mockPrisma.package.upsert.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      // Execute sync
      const result = await syncService.syncProvider(providerId);

      expect(result.upserted).toBeGreaterThan(0);
      expect(mockPrisma.syncHistory.update).toHaveBeenCalled();

      // Verify monitoring
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        {
          providerId,
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(),
          packagesSynced: 2,
          packagesFailed: 0,
          syncDurationMs: 5000,
        },
      ]);

      mockPrisma.package.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1); // 1 with FUP

      mockPrisma.providerHealth.findMany.mockResolvedValue([
        { providerId, healthScore: 0.95 },
      ]);

      const metrics = await monitoringService.getMetrics();

      expect(metrics.syncSuccessRate).toBe(100);
      expect(metrics.fupCoverage).toBe(50);
      expect(metrics.providerHealthScores[providerId]).toBe(0.95);
    });

    it('should handle provider degradation and recovery', async () => {
      const providerId = 'airalo';

      // Simulate failures
      for (let i = 0; i < 3; i++) {
        mockPrisma.providerHealth.upsert.mockResolvedValue({
          providerId,
          healthScore: Math.max(1.0 - (i + 1) * 0.1, 0.0),
          consecutiveFailures: i + 1,
          isDegraded: i + 1 >= 3,
        });

        await healthService.recordFailure(providerId, `Error ${i + 1}`);
      }

      // Check degradation
      mockPrisma.providerHealth.findUnique.mockResolvedValue({
        providerId,
        isDegraded: true,
        healthScore: 0.7,
      });

      const isDegraded = await healthService.isDegraded(providerId);
      expect(isDegraded).toBe(true);

      // Simulate recovery
      for (let i = 0; i < 5; i++) {
        mockPrisma.providerHealth.upsert.mockResolvedValue({
          providerId,
          healthScore: Math.min(0.7 + (i + 1) * 0.05, 1.0),
          isDegraded: false,
        });

        await healthService.recordSuccess(providerId, 100);
      }

      // Check recovery
      mockPrisma.providerHealth.findUnique.mockResolvedValue({
        providerId,
        isDegraded: false,
        healthScore: 0.95,
      });

      const isRecovered = !(await healthService.isDegraded(providerId));
      expect(isRecovered).toBe(true);
    });

    it('should classify all 8 package types correctly', () => {
      const testCases = [
        {
          input: { hasData: true, hasVoice: false, hasSms: false, isUnlimited: false, countries: ['US'] },
          expected: 'DATA_ONLY',
        },
        {
          input: { hasData: false, hasVoice: true, hasSms: false, isUnlimited: false, countries: ['US'] },
          expected: 'VOICE_ONLY',
        },
        {
          input: { hasData: false, hasVoice: false, hasSms: true, isUnlimited: false, countries: ['US'] },
          expected: 'TEXT_ONLY',
        },
        {
          input: { hasData: true, hasVoice: false, hasSms: true, isUnlimited: false, countries: ['US'] },
          expected: 'DATA_WITH_TEXT',
        },
        {
          input: { hasData: true, hasVoice: true, hasSms: false, isUnlimited: false, countries: ['US'] },
          expected: 'DATA_WITH_CALL',
        },
        {
          input: { hasData: false, hasVoice: true, hasSms: true, isUnlimited: false, countries: ['US'] },
          expected: 'TEXT_WITH_CALL',
        },
        {
          input: { hasData: true, hasVoice: true, hasSms: true, isUnlimited: false, countries: ['US'] },
          expected: 'ALL_INCLUSIVE',
        },
        {
          input: { hasData: true, hasVoice: true, hasSms: true, isUnlimited: true, countries: ['US'] },
          expected: 'DATA_WITH_ALL_UNLIMITED',
        },
      ];

      for (const testCase of testCases) {
        const result = classifierEnhanced.classify(testCase.input);
        expect(result.packageType).toBe(testCase.expected);
      }
    });

    it('should classify all 4 scope types correctly', () => {
      const testCases = [
        {
          countries: ['US'],
          expected: 'LOCAL',
        },
        {
          countries: ['DE', 'FR', 'IT'],
          expected: 'REGIONAL',
        },
        {
          countries: ['US', 'JP', 'AU'],
          expected: 'MULTI_COUNTRY',
        },
        {
          countries: Array.from({ length: 20 }, (_, i) => `C${i}`),
          expected: 'GLOBAL',
        },
      ];

      for (const testCase of testCases) {
        const result = classifierEnhanced.classify({
          hasData: true,
          hasVoice: false,
          hasSms: false,
          isUnlimited: false,
          countries: testCase.countries,
        });
        expect(result.scopeType).toBe(testCase.expected);
      }
    });

    it('should extract FUP information accurately', () => {
      const testCases = [
        {
          description: 'Unlimited data with fair usage policy. Speeds reduce to 512 Mbps after 2GB daily usage.',
          expectedThrottle: 2,
          expectedSpeed: 512,
        },
        {
          description: 'Unlimited with deprioritization after 5GB usage. Limited to 256 Mbps.',
          expectedThrottle: 5,
          expectedSpeed: 256,
        },
        {
          description: 'Standard 10GB package. No FUP.',
          expectedThrottle: undefined,
          expectedSpeed: undefined,
        },
      ];

      for (const testCase of testCases) {
        const result = classifierEnhanced.classify({
          hasData: true,
          hasVoice: false,
          hasSms: false,
          isUnlimited: testCase.description.includes('Unlimited'),
          countries: ['US'],
          description: testCase.description,
        });

        if (testCase.expectedThrottle) {
          expect(result.fup.throttleAfterGb).toBe(testCase.expectedThrottle);
          expect(result.fup.throttleSpeedMbps).toBe(testCase.expectedSpeed);
        }
      }
    });

    it('should handle pricing rule priority correctly', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 50,
          conditionJson: { country: 'US' },
          retailPrice: 22.99,
        },
        {
          id: 'rule-2',
          priority: 100,
          conditionJson: { country: 'US', packageType: 'DATA_ONLY' },
          retailPrice: 19.99,
        },
        {
          id: 'rule-3',
          priority: 150,
          conditionJson: { country: 'US', packageType: 'DATA_ONLY', scopeType: 'LOCAL' },
          retailPrice: 17.99,
        },
      ]);

      const result = await pricingRuleService.applyRules(24.99, {
        country: 'US',
        packageType: 'DATA_ONLY',
        scopeType: 'LOCAL',
      });

      // Should apply highest priority rule
      expect(result).toBe(17.99);
    });

    it('should track metrics through complete sync cycle', async () => {
      // Setup sync with mixed results
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(),
          packagesSynced: 100,
          packagesFailed: 1,
          syncDurationMs: 5000,
        },
        {
          providerId: 'esimgo',
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(),
          packagesSynced: 80,
          packagesFailed: 0,
          syncDurationMs: 4000,
        },
      ]);

      mockPrisma.package.count
        .mockResolvedValueOnce(200) // total packages
        .mockResolvedValueOnce(180); // with FUP

      mockPrisma.providerHealth.findMany.mockResolvedValue([
        { providerId: 'airalo', healthScore: 0.95 },
        { providerId: 'esimgo', healthScore: 0.90 },
      ]);

      const metrics = await monitoringService.getMetrics();

      expect(metrics.syncSuccessRate).toBeGreaterThan(95);
      expect(metrics.fupCoverage).toBeGreaterThan(85);
      expect(metrics.packageCount).toBe(200);
      expect(metrics.errorRate).toBeLessThan(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should recover from per-package errors', async () => {
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([
          { id: 'pkg-1', title: 'Package 1', dataAmount: 10, dataUnit: 'GB', duration: 30, wholesalePrice: 24.99, currency: 'USD', coverage: ['US'] },
          { id: 'pkg-2', title: 'Package 2', dataAmount: 5, dataUnit: 'GB', duration: 30, wholesalePrice: 14.99, currency: 'USD', coverage: ['US'] },
          { id: 'pkg-3', title: 'Package 3', dataAmount: 20, dataUnit: 'GB', duration: 30, wholesalePrice: 34.99, currency: 'USD', coverage: ['US'] },
        ]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });

      // First and third succeed, second fails
      mockPrisma.package.upsert
        .mockResolvedValueOnce({ id: 'pkg-1' })
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ id: 'pkg-3' });

      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      const result = await syncService.syncProvider(providerId);

      expect(result.upserted).toBe(2);
      expect(result.failed).toBe(1);
    });
  });
});
