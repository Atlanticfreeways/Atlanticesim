import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../config/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('PricingService', () => {
  let service: PricingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    package: {
      findUnique: jest.fn(),
    },
    provider: {
      findUnique: jest.fn(),
    },
    globalPricing: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRetailPrice', () => {
    const providerPrice = 10.00;
    const providerId = 'provider-123';
    const packageId = 'package-456';

    it('should use package override price when available', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue({
        retailPriceOverride: new Decimal(12.99),
      });

      const result = await service.calculateRetailPrice(providerPrice, providerId, packageId);

      expect(result).toBe(12.99);
      expect(mockPrismaService.package.findUnique).toHaveBeenCalledWith({
        where: { id: packageId },
        select: { retailPriceOverride: true },
      });
      expect(mockPrismaService.provider.findUnique).not.toHaveBeenCalled();
    });

    it('should use provider margin when no package override', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue({
        retailPriceOverride: null,
      });
      mockPrismaService.provider.findUnique.mockResolvedValue({
        defaultMargin: new Decimal(20), // 20%
        fixedMarkup: new Decimal(0.50),
      });

      const result = await service.calculateRetailPrice(providerPrice, providerId, packageId);

      // (10 * 1.20) + 0.50 = 12.50
      expect(result).toBe(12.50);
      expect(mockPrismaService.provider.findUnique).toHaveBeenCalledWith({
        where: { id: providerId },
        select: { defaultMargin: true, fixedMarkup: true },
      });
    });

    it('should use provider margin only when no markup', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue(null);
      mockPrismaService.provider.findUnique.mockResolvedValue({
        defaultMargin: new Decimal(15), // 15%
        fixedMarkup: null,
      });

      const result = await service.calculateRetailPrice(providerPrice, providerId);

      // 10 * 1.15 = 11.50
      expect(result).toBe(11.50);
    });

    it('should use provider markup only when no margin', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue(null);
      mockPrismaService.provider.findUnique.mockResolvedValue({
        defaultMargin: null,
        fixedMarkup: new Decimal(2.00),
      });

      const result = await service.calculateRetailPrice(providerPrice, providerId);

      // 10 + 2.00 = 12.00
      expect(result).toBe(12.00);
    });

    it('should use global pricing when no provider pricing', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue(null);
      mockPrismaService.provider.findUnique.mockResolvedValue({
        defaultMargin: null,
        fixedMarkup: null,
      });
      mockPrismaService.globalPricing.findFirst.mockResolvedValue({
        id: 'default',
        defaultMargin: new Decimal(15), // 15%
        fixedMarkup: new Decimal(0.00),
      });

      const result = await service.calculateRetailPrice(providerPrice, providerId);

      // 10 * 1.15 = 11.50
      expect(result).toBe(11.50);
      expect(mockPrismaService.globalPricing.findFirst).toHaveBeenCalledWith({
        where: { id: 'default' },
      });
    });

    it('should use global pricing with markup', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue(null);
      mockPrismaService.provider.findUnique.mockResolvedValue(null);
      mockPrismaService.globalPricing.findFirst.mockResolvedValue({
        id: 'default',
        defaultMargin: new Decimal(10), // 10%
        fixedMarkup: new Decimal(1.50),
      });

      const result = await service.calculateRetailPrice(providerPrice, providerId);

      // (10 * 1.10) + 1.50 = 12.50
      expect(result).toBe(12.50);
    });

    it('should use 15% default when no pricing configured', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue(null);
      mockPrismaService.provider.findUnique.mockResolvedValue(null);
      mockPrismaService.globalPricing.findFirst.mockResolvedValue(null);

      const result = await service.calculateRetailPrice(providerPrice, providerId);

      // 10 * 1.15 = 11.50
      expect(result).toBe(11.50);
    });

    it('should skip package lookup when packageId not provided', async () => {
      mockPrismaService.provider.findUnique.mockResolvedValue({
        defaultMargin: new Decimal(20),
        fixedMarkup: new Decimal(0),
      });

      const result = await service.calculateRetailPrice(providerPrice, providerId);

      expect(mockPrismaService.package.findUnique).not.toHaveBeenCalled();
      expect(result).toBe(12.00); // 10 * 1.20
    });

    it('should handle zero provider price', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue(null);
      mockPrismaService.provider.findUnique.mockResolvedValue({
        defaultMargin: new Decimal(15),
        fixedMarkup: new Decimal(1.00),
      });

      const result = await service.calculateRetailPrice(0, providerId);

      // (0 * 1.15) + 1.00 = 1.00
      expect(result).toBe(1.00);
    });

    it('should handle large provider prices', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue(null);
      mockPrismaService.provider.findUnique.mockResolvedValue({
        defaultMargin: new Decimal(10),
        fixedMarkup: new Decimal(0),
      });

      const result = await service.calculateRetailPrice(999.99, providerId);

      // 999.99 * 1.10 = 1099.989
      expect(result).toBeCloseTo(1099.989, 2);
    });
  });

  describe('formatPrice', () => {
    it('should format price to 2 decimal places', () => {
      expect(service.formatPrice(10.123456)).toBe(10.12);
      expect(service.formatPrice(10.999)).toBe(11.00);
      expect(service.formatPrice(10.995)).toBe(11.00);
      expect(service.formatPrice(10.994)).toBe(10.99);
    });

    it('should handle whole numbers', () => {
      expect(service.formatPrice(10)).toBe(10.00);
      expect(service.formatPrice(100)).toBe(100.00);
    });

    it('should handle zero', () => {
      expect(service.formatPrice(0)).toBe(0.00);
    });

    it('should handle negative numbers', () => {
      expect(service.formatPrice(-10.567)).toBe(-10.57);
    });

    it('should handle very small numbers', () => {
      expect(service.formatPrice(0.001)).toBe(0.00);
      expect(service.formatPrice(0.005)).toBe(0.01);
    });
  });

  describe('pricing hierarchy', () => {
    const providerPrice = 10.00;
    const providerId = 'provider-123';
    const packageId = 'package-456';

    it('should prioritize package override over provider pricing', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue({
        retailPriceOverride: new Decimal(15.00),
      });
      mockPrismaService.provider.findUnique.mockResolvedValue({
        defaultMargin: new Decimal(50), // Should be ignored
        fixedMarkup: new Decimal(5.00), // Should be ignored
      });

      const result = await service.calculateRetailPrice(providerPrice, providerId, packageId);

      expect(result).toBe(15.00);
    });

    it('should prioritize provider pricing over global pricing', async () => {
      mockPrismaService.package.findUnique.mockResolvedValue(null);
      mockPrismaService.provider.findUnique.mockResolvedValue({
        defaultMargin: new Decimal(20),
        fixedMarkup: new Decimal(0),
      });
      mockPrismaService.globalPricing.findFirst.mockResolvedValue({
        id: 'default',
        defaultMargin: new Decimal(50), // Should be ignored
        fixedMarkup: new Decimal(5.00), // Should be ignored
      });

      const result = await service.calculateRetailPrice(providerPrice, providerId);

      expect(result).toBe(12.00); // Uses provider pricing (10 * 1.20)
      expect(mockPrismaService.globalPricing.findFirst).not.toHaveBeenCalled();
    });
  });
});
