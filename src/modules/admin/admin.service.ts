import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
  ) { }

  async getDashboardStats() {
    const [totalUsers, totalOrders, totalEsims, activeProviders] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.eSim.count(),
      this.prisma.provider.count({ where: { isActive: true } }),
    ]);

    const recentOrders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true, package: true, provider: true },
    });

    return {
      stats: { totalUsers, totalOrders, totalEsims, activeProviders },
      recentOrders,
    };
  }

  async getProviderHealth() {
    const providers = await this.providersService.getAllProviders();
    const healthChecks = await Promise.all(
      providers.map(async (provider) => {
        try {
          const health = await this.providersService.getProviderHealth(provider.slug);
          return { ...provider, health };
        } catch (error) {
          return {
            ...provider,
            health: { isAvailable: false, responseTime: 0, lastChecked: new Date(), errorMessage: error.message },
          };
        }
      })
    );

    return healthChecks;
  }

  async getSalesAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        paymentStatus: 'COMPLETED',
      },
      include: { provider: true },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.paymentAmount), 0);
    const ordersByProvider = orders.reduce((acc, order) => {
      const provider = order.provider.name;
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {});

    const revenueByProvider = orders.reduce((acc, order) => {
      const provider = order.provider.name;
      acc[provider] = (acc[provider] || 0) + Number(order.paymentAmount);
      return acc;
    }, {});

    return {
      totalRevenue,
      totalOrders: orders.length,
      ordersByProvider,
      revenueByProvider,
      averageOrderValue: totalRevenue / orders.length || 0,
    };
  }

  async getUserAnalytics() {
    const [totalUsers, activeUsers, newUsersThisMonth] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {}),
    };
  }

  async updateProviderConfig(providerId: string, config: any) {
    return this.prisma.provider.update({
      where: { id: providerId },
      data: { config },
    });
  }
}