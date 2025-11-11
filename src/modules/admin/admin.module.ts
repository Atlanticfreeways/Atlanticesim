import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ProvidersModule } from '../providers/providers.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ProvidersModule, OrdersModule, UsersModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}