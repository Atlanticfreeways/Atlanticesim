import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PricingService } from './pricing.service';
import { CatalogSyncService } from './catalog-sync.service';
import { PackagesController } from './packages.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [PackagesService, PricingService, CatalogSyncService],
  controllers: [PackagesController],
  exports: [PackagesService, PricingService, CatalogSyncService],
})
export class PackagesModule {}
