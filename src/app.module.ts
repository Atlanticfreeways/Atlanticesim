import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { PackagesModule } from './modules/packages/packages.module';
import { OrdersModule } from './modules/orders/orders.module';
import { EsimsModule } from './modules/esims/esims.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QueuesModule } from './modules/queues/queues.module';
import { PartnersModule } from './modules/partners/partners.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PrismaModule } from './config/prisma.module';
import { SecretsManagerService } from './config/secrets-manager.service';
import { MonitoringService } from './config/monitoring.service';
import { MonitoringServiceEnhanced } from './config/monitoring-alerts.service';
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
      expandVariables: true,
      load: [() => {
        // Force .env values to override stale system env vars
        const dotenv = require('dotenv');
        const parsed = dotenv.config({ path: '.env' }).parsed || {};
        Object.assign(process.env, parsed);
        return parsed;
      }],
      validationSchema: validationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get('RATE_LIMIT_WINDOW_MS') || 60000,
          limit: config.get('RATE_LIMIT_MAX_REQUESTS') || 100,
        },
        {
          name: 'strict',
          ttl: 60000,
          limit: 10,
        },
        {
          name: 'login',
          ttl: 300000, // 5 mins
          limit: 5,
        }
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get('REDIS_URL');
        if (redisUrl) {
          const url = new URL(redisUrl);
          return { redis: { host: url.hostname, port: parseInt(url.port) || 6379 } };
        }
        return { redis: { host: config.get('REDIS_HOST') || 'localhost', port: config.get('REDIS_PORT') || 6379 } };
      },
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
    QueuesModule,
    PartnersModule,
    DashboardModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    SecretsManagerService,
    MonitoringService,
    MonitoringServiceEnhanced,
  ],
})
export class AppModule { }
