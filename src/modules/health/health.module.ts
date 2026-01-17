import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController, ProvidersHealthIndicator } from './health.controller';
import { PrismaModule } from '../../config/prisma.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
    imports: [
        TerminusModule,
        HttpModule,
        PrismaModule,
        ProvidersModule,
    ],
    controllers: [HealthController],
    providers: [ProvidersHealthIndicator],
})
export class HealthModule { }
