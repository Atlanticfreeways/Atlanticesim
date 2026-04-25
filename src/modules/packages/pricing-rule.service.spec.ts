import { Test, TestingModule } from '@nestjs/testing';
import { PricingRuleService } from './pricing-rule.service';
import { PrismaService } from '../../config/prisma.service';

describe('PricingRuleService', () => {
  let service: PricingRuleService;
  let prisma: PrismaService;

  const mockPrisma = {
    pricingRule: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingRuleService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PricingRuleService>(PricingRuleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRule', () => {
    it('should create a new pricing rule', async () => {
      const input = {
        priority: 100,
        condition: { country: 'US', packageType: 'DATA_ONLY' },
        retailPrice: 19.99,
        expiresAt: new Date('2026-05-31'),
      };

      mockPrisma.pricingRule.create.mockResolvedValue({
        id: 'rule-1',
        ...input,
      });

      const result = await service.createRule(input);

      expect(result.id).toBe('rule-1');
      expect(mockPrisma.pricingRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 100,
          retailPrice: expect.any(Object),
        }),
      });
    });

    it('should invalidate cache after creating rule', async () => {
      mockPrisma.pricingRule.create.mockResolvedValue({
        id: 'rule-1',
        priority: 100,
      });

      await service.createRule({
        priority: 100,
        condition: {},
        retailPrice: 19.99,
      });

      // Cache should be invalidated
      expect(service['rulesCache'].length).toBe(0);
    });

    it('should support rules without expiration', async () => {
      const input = {
        priority: 50,
        condition: { region: 'EU' },
        retailPrice: 24.99,
      };

      mockPrisma.pricingRule.create.mockResolvedValue({
        id: 'rule-2',
        ...input,
        expiresAt: null,
      });

      const result = await service.createRule(input);

      expect(result.expiresAt).toBeNull();
    });
  });

  describe('applyRules', () => {
    it('should apply highest priority matching rule', async () => {
      const basePrice = 24.99;
      const packageData = {
        country: 'US',
        packageType: 'DATA_ONLY',
      };

      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { country: 'US', packageType: 'DATA_ONLY' },
          retailPrice: 19.99,
        },
        {
          id: 'rule-2',
          priority: 50,
          conditionJson: { country: 'US' },
          retailPrice: 22.99,
        },
      ]);

      const result = await service.applyRules(basePrice, packageData);

      expect(result).toBe(19.99);
      expect(mockPrisma.pricingRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: { appliedCount: { increment: 1 } },
      });
    });

    it('should return base price if no rules match', async () => {
      const basePrice = 24.99;
      const packageData = {
        country: 'JP',
        packageType: 'VOICE_ONLY',
      };

      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { country: 'US' },
          retailPrice: 19.99,
        },
      ]);

      const result = await service.applyRules(basePrice, packageData);

      expect(result).toBe(basePrice);
    });

    it('should match country condition', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { country: 'US' },
          retailPrice: 19.99,
        },
      ]);

      const result = await service.applyRules(24.99, { country: 'US' });

      expect(result).toBe(19.99);
    });

    it('should not match different country', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { country: 'US' },
          retailPrice: 19.99,
        },
      ]);

      const result = await service.applyRules(24.99, { country: 'CA' });

      expect(result).toBe(24.99);
    });

    it('should match packageType condition', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { packageType: 'DATA_ONLY' },
          retailPrice: 19.99,
        },
      ]);

      const result = await service.applyRules(24.99, { packageType: 'DATA_ONLY' });

      expect(result).toBe(19.99);
    });

    it('should match scopeType condition', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { scopeType: 'GLOBAL' },
          retailPrice: 29.99,
        },
      ]);

      const result = await service.applyRules(24.99, { scopeType: 'GLOBAL' });

      expect(result).toBe(29.99);
    });

    it('should match region condition', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { region: 'EU' },
          retailPrice: 21.99,
        },
      ]);

      const result = await service.applyRules(24.99, { region: 'EU' });

      expect(result).toBe(21.99);
    });

    it('should use cache for subsequent calls', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { country: 'US' },
          retailPrice: 19.99,
        },
      ]);

      // First call
      await service.applyRules(24.99, { country: 'US' });

      // Second call should use cache
      await service.applyRules(24.99, { country: 'US' });

      // findMany should only be called once
      expect(mockPrisma.pricingRule.findMany).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache after expiry', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { country: 'US' },
          retailPrice: 19.99,
        },
      ]);

      // First call
      await service.applyRules(24.99, { country: 'US' });

      // Manually expire cache
      service['cacheExpiry'] = 0;

      // Second call should refresh
      await service.applyRules(24.99, { country: 'US' });

      expect(mockPrisma.pricingRule.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteExpiredRules', () => {
    it('should delete rules with past expiration date', async () => {
      mockPrisma.pricingRule.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.deleteExpiredRules();

      expect(result).toBe(3);
      expect(mockPrisma.pricingRule.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });

    it('should invalidate cache after deleting rules', async () => {
      mockPrisma.pricingRule.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteExpiredRules();

      expect(service['rulesCache'].length).toBe(0);
    });

    it('should return 0 if no rules expired', async () => {
      mockPrisma.pricingRule.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.deleteExpiredRules();

      expect(result).toBe(0);
    });
  });

  describe('complex pricing scenarios', () => {
    it('should handle multiple conditions in a rule', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: {
            country: 'US',
            packageType: 'DATA_ONLY',
            scopeType: 'LOCAL',
          },
          retailPrice: 15.99,
        },
      ]);

      const result = await service.applyRules(24.99, {
        country: 'US',
        packageType: 'DATA_ONLY',
        scopeType: 'LOCAL',
      });

      expect(result).toBe(15.99);
    });

    it('should not match if any condition fails', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: {
            country: 'US',
            packageType: 'DATA_ONLY',
          },
          retailPrice: 15.99,
        },
      ]);

      const result = await service.applyRules(24.99, {
        country: 'US',
        packageType: 'VOICE_ONLY', // Different package type
      });

      expect(result).toBe(24.99);
    });

    it('should apply rules in priority order', async () => {
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
      ]);

      const result = await service.applyRules(24.99, {
        country: 'US',
        packageType: 'DATA_ONLY',
      });

      // Should apply rule-2 (higher priority)
      expect(result).toBe(19.99);
    });

    it('should handle promotional pricing with date range', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: {
            country: 'US',
            dateRange: {
              start: yesterday,
              end: tomorrow,
            },
          },
          retailPrice: 14.99,
        },
      ]);

      const result = await service.applyRules(24.99, { country: 'US' });

      expect(result).toBe(14.99);
    });

    it('should not apply rule outside date range', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: {
            country: 'US',
            dateRange: {
              start: tomorrow,
              end: dayAfterTomorrow,
            },
          },
          retailPrice: 14.99,
        },
      ]);

      const result = await service.applyRules(24.99, { country: 'US' });

      expect(result).toBe(24.99);
    });
  });

  describe('rule usage tracking', () => {
    it('should increment appliedCount when rule is used', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { country: 'US' },
          retailPrice: 19.99,
          appliedCount: 0,
        },
      ]);

      await service.applyRules(24.99, { country: 'US' });

      expect(mockPrisma.pricingRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: { appliedCount: { increment: 1 } },
      });
    });

    it('should track multiple rule applications', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 100,
          conditionJson: { country: 'US' },
          retailPrice: 19.99,
        },
      ]);

      // Apply rule 5 times
      for (let i = 0; i < 5; i++) {
        await service.applyRules(24.99, { country: 'US' });
      }

      expect(mockPrisma.pricingRule.update).toHaveBeenCalledTimes(5);
    });
  });
});
