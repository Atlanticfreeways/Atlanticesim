import { Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
    IProviderAdapter,
    ProviderHealth,
    PackageFilters,
    Package,
    CreateOrderDto,
    Order,
    OrderStatus,
    ActivationResult,
    ESIMDetails,
} from '../interfaces/provider.interface';

import { PrismaService } from '../../../config/prisma.service';
import { EncryptionUtil } from '../../utils/encryption.util';

export abstract class BaseProviderAdapter implements IProviderAdapter {
    protected readonly logger: Logger;
    protected readonly httpClient: AxiosInstance;
    protected readonly providerName: string;
    protected readonly baseUrl: string;
    protected apiKey: string;
    protected readonly context: string;
    protected readonly prisma: PrismaService;

    constructor(
      providerName: string, 
      baseUrl: string, 
      apiKey: string, 
      httpClient?: AxiosInstance,
        prisma?: PrismaService
    ) {
        this.providerName = providerName;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.prisma = prisma;
        this.context = `${providerName}Adapter`;
        this.logger = new Logger(this.context);

        this.httpClient = httpClient || axios.create({
            baseURL: this.baseUrl,
            timeout: 10000, // 10s timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!httpClient) {
            this.setupInterceptors();
            // Removed setupAuthHeader() from constructor to avoid DI race conditions in subclasses.
            // Subclasses should call this in their methods or constructor as appropriate.
        }
    }

    /**
     * Configure authentication header. 
     * Asynchronously loads the API key from the database and decrypts it.
     */
    protected async setupAuthHeader(): Promise<void> {
        if (!this.apiKey && this.prisma) {
            const providerSlug = this.providerName.toLowerCase().replace(/\s+/g, '-');
            const providerRecord = await this.prisma.provider.findUnique({ where: { slug: providerSlug } });
            
            if (providerRecord && providerRecord.config) {
                const config = providerRecord.config as any;
                if (config.apiKey) {
                    try {
                        this.apiKey = EncryptionUtil.decrypt(config.apiKey);
                    } catch (e) {
                         // Fallback to raw key if decryption fails (e.g., legacy seed)
                         this.apiKey = config.apiKey;
                    }
                }
            }
        }

        if (this.apiKey) {
            this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.apiKey}`;
        }
    }

    private setupInterceptors(): void {
        // Request Interceptor
        this.httpClient.interceptors.request.use(
            (config: any) => {
                const method = config.method?.toUpperCase() || 'UNKNOWN';
                const url = config.url || '';
                this.logger.debug(`Request: ${method} ${url}`);
                return config;
            },
            (error: any) => {
                this.logger.error(`Request Error: ${error.message}`, error.stack);
                return Promise.reject(error);
            },
        );

        // Response Interceptor
        this.httpClient.interceptors.response.use(
            (response: AxiosResponse) => {
                const method = response.config.method?.toUpperCase() || 'UNKNOWN';
                const url = response.config.url || '';
                this.logger.debug(`Response: ${response.status} ${method} ${url}`);
                return response;
            },
            (error: any) => {
                const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
                const url = error.config?.url || '';

                let errorMessage = error.message;
                if (error.response) {
                    // Sever responded with a status code out of 2xx range
                    errorMessage = `API Error ${error.response.status}: ${JSON.stringify(error.response.data)}`;
                }

                this.logger.error(`Response Error [${method} ${url}]: ${errorMessage}`);
                return Promise.reject(error);
            },
        );
    }

    getProviderName(): string {
        return this.providerName;
    }

    /**
     * Standard health check implementation with timeout and better error handling.
     * Subclasses can override this for provider-specific health checks.
     */
    async checkHealth(): Promise<ProviderHealth> {
        const startTime = Date.now();
        const providerName = this.providerName;

        try {
            // Try to hit a lightweight endpoint with timeout
            const healthCheckPromise = this.httpClient.get('/status', {
                timeout: 5000,
                validateStatus: (status) => status < 500, // Accept any non-5xx as "alive"
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Health check timeout')), 5000)
            );

            await Promise.race([healthCheckPromise, timeoutPromise]);

            return {
                isAvailable: true,
                responseTime: Date.now() - startTime,
                lastChecked: new Date(),
                provider: providerName,
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            let errorMessage = error.message;

            // Provide more context for common errors
            if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Connection refused - service may be down';
            } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
                errorMessage = 'Request timeout - service is slow or unresponsive';
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                errorMessage = 'Authentication failed - check API credentials';
            } else if (error.response?.status >= 500) {
                errorMessage = `Server error: ${error.response.status}`;
            }

            this.logger.warn(`Health check failed for ${providerName}: ${errorMessage}`);

            return {
                isAvailable: false,
                responseTime,
                lastChecked: new Date(),
                errorMessage,
                provider: providerName,
            };
        }
    }

    // Abstract methods to be implemented by concrete providers
    abstract searchPackages(filters: PackageFilters): Promise<Package[]>;
    abstract getPackageDetails(packageId: string): Promise<Package>;
    abstract createOrder(orderData: CreateOrderDto): Promise<Order>;
    abstract getOrderStatus(orderId: string): Promise<OrderStatus>;
    abstract activateESIM(esimId: string): Promise<ActivationResult>;
    abstract getESIMDetails(esimId: string): Promise<ESIMDetails>;
    abstract getQRCode(esimId: string): Promise<string>;
}
