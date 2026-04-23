import { Module } from '@nestjs/common';
import { PartnersController } from './partners.controller';
import { PartnerConsoleController } from './partner-console.controller';
import { ProvidersModule } from '../providers/providers.module';
import { WalletService } from './wallet.service';
import { PartnerProfileService } from './partner-profile.service';
import { WebhookDispatcherService } from './webhook-dispatcher.service';

@Module({
  imports: [ProvidersModule],
  controllers: [PartnersController, PartnerConsoleController],
  providers: [WalletService, PartnerProfileService, WebhookDispatcherService],
  exports: [WalletService, PartnerProfileService, WebhookDispatcherService],
})
export class PartnersModule {}
