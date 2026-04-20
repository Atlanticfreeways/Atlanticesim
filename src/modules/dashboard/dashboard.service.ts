import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { UserRole } from '@prisma/client';
import { WalletService } from '../partners/wallet.service';
import { PartnerProfileService } from '../partners/partner-profile.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private partnerProfileService: PartnerProfileService,
  ) {}

  async getDashboardData(userId: string, role: UserRole) {
    // 1. Fetch User Stats
    const stats = await this.getUserStats(userId);

    // 2. Fetch Active eSIMs
    const esims = await this.prisma.eSim.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { activatedAt: 'desc' },
      take: 5,
    });

    // 3. Fetch Recent Orders
    const recentOrders = await this.prisma.order.findMany({
      where: { userId },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    let extraData = {};

    // 4. B2B Logic: Add Wallet and Profile if partner
    if (role === UserRole.BUSINESS_PARTNER) {
      const wallet = await this.walletService.getWallet(userId);
      const profile = await this.partnerProfileService.getProfile(userId);
      
      extraData = {
        walletBalance: wallet.balance,
        partnerProfile: {
          companyName: profile.companyName,
          webhookUrl: profile.webhookUrl,
          wholesaleMargin: profile.wholesaleMargin,
        }
      };
    }

    return {
      user: { id: userId, role },
      stats,
      esims,
      recentOrders,
      ...extraData,
    };
  }

  private async getUserStats(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { paymentAmount: true },
    });

    const esims = await this.prisma.eSim.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const totalSpent = orders.reduce((sum, o) => sum + o.paymentAmount.toNumber(), 0);
    const totalDataUsed = esims.reduce((sum, e) => sum + e.dataUsed, 0);

    return {
      activeESIMs: esims.length,
      totalSpent,
      totalDataUsed,
      currency: 'USD',
      activeCountries: 0, // In a real system, count distinct countries across active ESIMs
    };
  }
}
