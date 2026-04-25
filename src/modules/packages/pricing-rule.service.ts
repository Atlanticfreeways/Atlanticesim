import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface PricingCondition {
  country?: string;
  region?: string;
  packageType?: string;
  scopeType?: string;
  minPrice?: number;
  maxPrice?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PricingRuleInput {
  priority: number;
  condition: PricingCondition;
  retailPrice: number;
  expiresAt?: Date;
}

@Injectable()
export class PricingRuleService {
  private readonly logger = new Logger(PricingRuleService.name);
  private rulesCache: any[] = [];
  private cacheExpiry = 0;

  constructor(private prisma: PrismaService) {}

  async createRule(input: PricingRuleInput): Promise<any> {
    const rule = await this.prisma.pricingRule.create({
      data: {
        priority: input.priority,
        conditionJson: input.condition as any,
        retailPrice: new Decimal(input.retailPrice),
        expiresAt: input.expiresAt,
      },
    });

    this.invalidateCache();
    this.logger.log(`Created pricing rule with priority ${input.priority}`);
    return rule;
  }

  async applyRules(
    basePrice: number,
    packageData: {
      country?: string;
      region?: string;
      packageType?: string;
      scopeType?: string;
    },
  ): Promise<number> {
    const rules = await this.getRules();

    for (const rule of rules) {
      if (this.matchesCondition(rule.conditionJson, packageData)) {
        if (rule.retailPrice) {
          await this.prisma.pricingRule.update({
            where: { id: rule.id },
            data: { appliedCount: { increment: 1 } },
          });

          this.logger.debug(
            `Applied pricing rule (priority ${rule.priority}): ${basePrice} -> ${rule.retailPrice}`,
          );
          return Number(rule.retailPrice);
        }
      }
    }

    return basePrice;
  }

  private async getRules(): Promise<any[]> {
    const now = Date.now();
    if (this.rulesCache.length > 0 && this.cacheExpiry > now) {
      return this.rulesCache;
    }

    const rules = await this.prisma.pricingRule.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { priority: 'desc' },
    });

    this.rulesCache = rules;
    this.cacheExpiry = now + 5 * 60 * 1000;
    return rules;
  }

  private matchesCondition(condition: any, packageData: any): boolean {
    if (condition.country && packageData.country !== condition.country) return false;
    if (condition.region && packageData.region !== condition.region) return false;
    if (condition.packageType && packageData.packageType !== condition.packageType) return false;
    if (condition.scopeType && packageData.scopeType !== condition.scopeType) return false;

    if (condition.minPrice && packageData.price < condition.minPrice) return false;
    if (condition.maxPrice && packageData.price > condition.maxPrice) return false;

    if (condition.dateRange) {
      const now = new Date();
      if (now < condition.dateRange.start || now > condition.dateRange.end) return false;
    }

    return true;
  }

  async deleteExpiredRules(): Promise<number> {
    const result = await this.prisma.pricingRule.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Deleted ${result.count} expired pricing rules`);
      this.invalidateCache();
    }

    return result.count;
  }

  private invalidateCache(): void {
    this.rulesCache = [];
    this.cacheExpiry = 0;
  }
}
