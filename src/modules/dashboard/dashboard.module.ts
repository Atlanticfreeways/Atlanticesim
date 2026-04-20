import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { OrdersModule } from '../orders/orders.module';
import { EsimsModule } from '../esims/esims.module';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [
    OrdersModule,
    EsimsModule,
    PartnersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
