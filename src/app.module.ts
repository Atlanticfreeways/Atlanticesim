import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { PackagesModule } from './modules/packages/packages.module';
import { OrdersModule } from './modules/orders/orders.module';
import { EsimsModule } from './modules/esims/esims.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaModule } from './config/prisma.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { validationSchema } from './config/env.validation';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300000, // 5 minutes
      max: 100,
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      validationSchema: validationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        ttl: config.get('RATE_LIMIT_WINDOW_MS') || 60000,
        limit: config.get('RATE_LIMIT_MAX_REQUESTS') || 100,
      }],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProvidersModule,
    PackagesModule,
    OrdersModule,
    EsimsModule,
    PaymentsModule,
    AdminModule,
    NotificationsModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }