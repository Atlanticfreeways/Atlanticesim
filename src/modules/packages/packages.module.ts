import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PricingService } from './pricing.service';
import { CatalogSyncService } from './catalog-sync.service';
import { CatalogSyncServiceEnhanced } from './catalog-sync-enhanced.service';
import { PricingRuleService } from './pricing-rule.service';
import { PackagesController } from './packages.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [
    PackagesService,
    PricingService,
    CatalogSyncService,
    CatalogSyncServiceEnhanced,
    PricingRuleService,
  ],
  controllers: [PackagesController],
  exports: [
    PackagesService,
    PricingService,
    CatalogSyncService,
    CatalogSyncServiceEnhanced,
    PricingRuleService,
  ],
})
export class PackagesModule {}
