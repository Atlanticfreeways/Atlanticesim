import { Module } from '@nestjs/common';
import { EsimsService } from './esims.service';
import { EsimsController } from './esims.controller';
import { UsageSyncService } from './usage-sync.service';
import { UsagePredictorService } from './usage-predictor.service';
import { ProvidersModule } from '../providers/providers.module';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [ProvidersModule, PartnersModule],
  providers: [EsimsService, UsageSyncService, UsagePredictorService],
  controllers: [EsimsController],
  exports: [EsimsService, UsageSyncService, UsagePredictorService],
})
export class EsimsModule {}
