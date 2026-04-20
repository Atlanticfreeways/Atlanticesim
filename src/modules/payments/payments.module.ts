import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';

import { PaystackGateway } from './gateways/paystack.gateway';
import { CryptoGateway } from './gateways/crypto.gateway';

@Module({
  imports: [OrdersModule],
  providers: [PaymentsService, PaystackGateway, CryptoGateway],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}