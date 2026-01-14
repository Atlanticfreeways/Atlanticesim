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

export abstract class BaseProviderAdapter implements IProviderAdapter {
    protected readonly logger: Logger;
    protected readonly httpClient: AxiosInstance;
    protected readonly providerName: string;
    protected readonly baseUrl: string;
    protected readonly apiKey: string;
    protected readonly context: string;

    constructor(providerName: string, baseUrl: string, apiKey: string) {
        this.providerName = providerName;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.context = `${providerName}Adapter`;
        this.logger = new Logger(this.context);

        this.httpClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000, // 10s timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
        this.setupAuthHeader();
    }

    /**
     * Configure authentication header. Can be overridden by subclasses if different auth scheme is needed.
     */
    protected setupAuthHeader(): void {
        if (this.apiKey) {
            // Default to Bearer token, override in subclass if needed (e.g., 'X-API-Key')
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
     * Standard health check implementation. Can be overridden.
     */
    async checkHealth(): Promise<ProviderHealth> {
        const startTime = Date.now();
        try {
            // Try to hit a lightweight endpoint, defaulting to system check or root
            // Subclasses should ensure this endpoint exists or override this method
            await this.httpClient.get('/status');

            return {
                isAvailable: true,
                responseTime: Date.now() - startTime,
                lastChecked: new Date(),
                provider: this.providerName,
            };
        } catch (error) {
            return {
                isAvailable: false,
                responseTime: Date.now() - startTime,
                lastChecked: new Date(),
                errorMessage: error.message,
                provider: this.providerName,
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
