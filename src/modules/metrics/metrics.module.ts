import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
    imports: [
        PrometheusModule.register({
            path: '/metrics',
            defaultMetrics: {
                enabled: true,
            },
        }),
    ],
    providers: [
        makeCounterProvider({
            name: 'package_search_total',
            help: 'Total number of package search requests',
            labelNames: ['country', 'status'], // tracked in service
        }),
        makeHistogramProvider({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
        }),
    ],
    exports: [PrometheusModule],
})
export class MetricsModule { }
