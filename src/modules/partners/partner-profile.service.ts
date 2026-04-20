import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class PartnerProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Lazy create profile
      return this.prisma.partnerProfile.create({
        data: { userId },
      });
    }
    return profile;
  }

  async updateBranding(userId: string, logoUrl: string, primaryColor: string) {
    return this.prisma.partnerProfile.update({
      where: { userId },
      data: { logoUrl, primaryColor },
    });
  }

  /**
   * Calculate wholesale price based on partner's margin
   */
  async calculateWholesalePrice(userId: string, retailPrice: number): Promise<number> {
    const profile = await this.getProfile(userId);
    const margin = profile.wholesaleMargin.toNumber() / 100;
    return retailPrice * (1 - margin);
  }
}
