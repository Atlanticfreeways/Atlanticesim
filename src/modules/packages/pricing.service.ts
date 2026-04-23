import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculates the retail price for a package based on the hierarchy:
   * 1. Package Override
   * 2. Provider Margin/Markup
   * 3. Global Margin/Markup
   */
  async calculateRetailPrice(
    providerPrice: number,
    providerId: string,
    packageId?: string,
  ): Promise<number> {
    // 1. Check for Package Override
    if (packageId) {
      const pkg = await this.prisma.package.findUnique({
        where: { id: packageId },
        select: { retailPriceOverride: true },
      });
      if (pkg?.retailPriceOverride) {
        return pkg.retailPriceOverride.toNumber();
      }
    }

    // 2. Check for Provider Margin/Markup
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: { defaultMargin: true, fixedMarkup: true },
    });

    if (provider && (provider.defaultMargin || provider.fixedMarkup)) {
      const margin = provider.defaultMargin ? provider.defaultMargin.toNumber() / 100 : 0;
      const markup = provider.fixedMarkup ? provider.fixedMarkup.toNumber() : 0;
      return (providerPrice * (1 + margin)) + markup;
    }

    // 3. Fallback to Global Margin/Markup
    const globalPricing = await this.prisma.globalPricing.findFirst({
      where: { id: 'default' },
    });

    if (globalPricing) {
      const margin = globalPricing.defaultMargin.toNumber() / 100;
      const markup = globalPricing.fixedMarkup.toNumber();
      return (providerPrice * (1 + margin)) + markup;
    }

    // Absolute fallback (e.g. if seed didn't run)
    return providerPrice * 1.15; // 15% default
  }

  /**
   * Formats a price with correct decimal places
   */
  formatPrice(price: number): number {
    return Math.round(price * 100) / 100;
  }
}
