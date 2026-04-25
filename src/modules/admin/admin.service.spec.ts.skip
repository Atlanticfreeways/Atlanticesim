import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: PrismaService;
  let providersService: ProvidersService;

  const mockProviders = [
    { id: 'p1', name: 'Provider A', slug: 'provider-a', isActive: true },
    { id: 'p2', name: 'Provider B', slug: 'provider-b', isActive: true },
  ];

  const mockOrders = [
    {
      id: 'order-1',
      paymentAmount: 29.99,
      paymentStatus: 'COMPLETED',
      createdAt: new Date(),
      user: { id: 'user-1', email: 'user@example.com' },
      package: { id: 'pkg-1', name: '10GB' },
      provider: { id: 'p1', name: 'Provider A' },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            order: {
              count: jest.fn(),
              findMany: jest.fn(),
            },
            eSim: {
              count: jest.fn(),
            },
            provider: {
              count: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ProvidersService,
          useValue: {
            getAllProviders: jest.fn(),
            getProviderHealth: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);
    providersService = module.get<ProvidersService>(ProvidersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should retrieve dashboard statistics', async () => {
      (prismaService.user.count as jest.Mock).mockResolvedValue(100);
      (prismaService.order.count as jest.Mock).mockResolvedValue(50);
      (prismaService.eSim.count as jest.Mock).mockResolvedValue(75);
      (prismaService.provider.count as jest.Mock).mockResolvedValue(5);
      (prismaService.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('recentOrders');
      expect(result.stats.totalUsers).toBe(100);
      expect(result.stats.totalOrders).toBe(50);
      expect(result.stats.totalEsims).toBe(75);
      expect(result.stats.activeProviders).toBe(5);
    });

    it('should retrieve recent orders', async () => {
      (prismaService.user.count as jest.Mock).mockResolvedValue(100);
      (prismaService.order.count as jest.Mock).mockResolvedValue(50);
      (prismaService.eSim.count as jest.Mock).mockResolvedValue(75);
      (prismaService.provider.count as jest.Mock).mockResolvedValue(5);
      (prismaService.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.getDashboardStats();

      expect(result.recentOrders).toHaveLength(1);
      expect(result.recentOrders[0].id).toBe('order-1');
    });

    it('should handle database errors', async () => {
      (prismaService.user.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.getDashboardStats()).rejects.toThrow('Database error');
    });
  });

  describe('getProviderHealth', () => {
    it('should retrieve provider health status', async () => {
      const mockHealth = [
        { ...mockProviders[0], health: { isAvailable: true, responseTime: 100 } },
        { ...mockProviders[1], health: { isAvailable: true, responseTime: 150 } },
      ];

      (providersService.getAllProviders as jest.Mock).mockResolvedValue(mockProviders);
      (providersService.getProviderHealth as jest.Mock)
        .mockResolvedValueOnce(mockHealth[0].health)
        .mockResolvedValueOnce(mockHealth[1].health);

      const result = await service.getProviderHealth();

      expect(result).toHaveLength(2);
      expect(result[0].health.isAvailable).toBe(true);
    });

    it('should handle provider health check failure', async () => {
      (providersService.getAllProviders as jest.Mock).mockResolvedValue(mockProviders);
      (providersService.getProviderHealth as jest.Mock).mockRejectedValue(
        new Error('Health check failed'),
      );

      const result = await service.getProviderHealth();

      expect(result[0].health.isAvailable).toBe(false);
    });

    it('should include response time in health check', async () => {
      const mockHealth = { isAvailable: true, responseTime: 120, lastChecked: new Date() };

      (providersService.getAllProviders as jest.Mock).mockResolvedValue([mockProviders[0]]);
      (providersService.getProviderHealth as jest.Mock).mockResolvedValue(mockHealth);

      const result = await service.getProviderHealth();

      expect(result[0].health.responseTime).toBe(120);
    });
  });

  describe('getSalesAnalytics', () => {
    it('should retrieve sales analytics', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.getSalesAnalytics(30);

      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('ordersByProvider');
      expect(result).toHaveProperty('revenueByProvider');
      expect(result).toHaveProperty('averageOrderValue');
    });

    it('should calculate total revenue correctly', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.getSalesAnalytics(30);

      expect(result.totalRevenue).toBe(29.99);
    });

    it('should group orders by provider', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.getSalesAnalytics(30);

      expect(result.ordersByProvider['Provider A']).toBe(1);
    });

    it('should calculate average order value', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.getSalesAnalytics(30);

      expect(result.averageOrderValue).toBe(29.99);
    });

    it('should handle empty orders', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getSalesAnalytics(30);

      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.averageOrderValue).toBe(0);
    });

    it('should use correct date range', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      await service.getSalesAnalytics(30);

      const callArgs = (prismaService.order.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.createdAt.gte).toBeDefined();
    });
  });

  describe('getUserAnalytics', () => {
    it('should retrieve user analytics', async () => {
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(85) // activeUsers
        .mockResolvedValueOnce(20); // newUsersThisMonth

      (prismaService.user.groupBy as jest.Mock).mockResolvedValue([
        { role: 'END_USER', _count: { role: 95 } },
        { role: 'ADMIN', _count: { role: 5 } },
      ]);

      const result = await service.getUserAnalytics();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('newUsersThisMonth');
      expect(result).toHaveProperty('usersByRole');
    });

    it('should count total users', async () => {
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(20);

      (prismaService.user.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserAnalytics();

      expect(result.totalUsers).toBe(100);
    });

    it('should count active users', async () => {
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(20);

      (prismaService.user.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserAnalytics();

      expect(result.activeUsers).toBe(85);
    });

    it('should group users by role', async () => {
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(20);

      (prismaService.user.groupBy as jest.Mock).mockResolvedValue([
        { role: 'END_USER', _count: { role: 95 } },
        { role: 'ADMIN', _count: { role: 5 } },
      ]);

      const result = await service.getUserAnalytics();

      expect((result.usersByRole as any).END_USER).toBe(95);
      expect((result.usersByRole as any).ADMIN).toBe(5);
    });
  });

  describe('updateProviderConfig', () => {
    it('should update provider configuration', async () => {
      const providerId = 'p1';
      const newConfig = { apiKey: 'new-key', timeout: 5000 };

      (prismaService.provider.update as jest.Mock).mockResolvedValue({
        id: providerId,
        config: newConfig,
      });

      const result = await service.updateProviderConfig(providerId, newConfig);

      expect(prismaService.provider.update).toHaveBeenCalledWith({
        where: { id: providerId },
        data: { config: newConfig },
      });
      expect(result.config).toEqual(newConfig);
    });

    it('should handle invalid provider id', async () => {
      (prismaService.provider.update as jest.Mock).mockRejectedValue(
        new Error('Provider not found'),
      );

      await expect(service.updateProviderConfig('invalid', {})).rejects.toThrow(
        'Provider not found',
      );
    });

    it('should handle database errors', async () => {
      (prismaService.provider.update as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.updateProviderConfig('p1', {})).rejects.toThrow('Database error');
    });
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(service.getDashboardStats).toBeDefined();
      expect(service.getProviderHealth).toBeDefined();
      expect(service.getSalesAnalytics).toBeDefined();
      expect(service.getUserAnalytics).toBeDefined();
      expect(service.updateProviderConfig).toBeDefined();
    });

    it('should inject PrismaService', () => {
      expect(prismaService).toBeDefined();
    });

    it('should inject ProvidersService', () => {
      expect(providersService).toBeDefined();
    });
  });
});
