import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { BaseProviderAdapter } from '../../../common/providers/base-provider.adapter';
import { WithCircuitBreaker } from '../../../common/providers/circuit-breaker.decorator';
import {
    PackageFilters,
    Package,
    CreateOrderDto,
    Order,
    OrderStatus,
    ActivationResult,
    ESIMDetails,
} from '../../../common/interfaces/provider.interface';

@Injectable()
export class EsimGoAdapter extends BaseProviderAdapter {
    constructor(
        private configService: ConfigService,
        @Optional() httpClient?: AxiosInstance,
    ) {
        super(
            'eSIMGo',
            configService.get('ESIM_GO_BASE_URL') || 'https://api.esim-go.com/v2.4',
            configService.get('eSIM_Go_API_KEY') || '',
            httpClient,
        );
        this.setupAuthHeader();
    }

    protected setupAuthHeader(): void {
        // eSIM Go uses X-API-Key header
        this.httpClient.defaults.headers.common['X-API-Key'] = this.apiKey;
    }

    @WithCircuitBreaker()
    async searchPackages(filters: PackageFilters): Promise<Package[]> {
        this.setupAuthHeader();
        try {
            const params: any = { perPage: 50 };
            if (filters.country) {
                params.countries = filters.country;
            }
            // TODO: Handle regions / other filters

            const response = await this.httpClient.get('/catalogue', { params });

            const bundles = response.data;

            return Array.isArray(bundles)
                ? bundles.map((b: any) => this.mapToPackage(b))
                : [];

        } catch (error) {
            this.logger.error(`Failed to search packages: ${error.message}`);
            return [];
        }
    }

    private mapToPackage(bundle: any): Package {
        return {
            id: bundle.name, // eSIM Go uses name as ID
            providerId: 'esim-go',
            providerName: 'eSIM Go',
            title: bundle.description || bundle.name,
            description: bundle.description || '',
            country: bundle.countries?.[0]?.iso || '',
            dataAmount: bundle.dataAmount || 0,
            dataUnit: 'MB', // Schema confirms MB
            duration: bundle.duration || 0,
            price: bundle.price || 0,
            currency: 'USD',
            coverage: bundle.countries?.map((c: any) => c.iso) || [],
            isActive: true,
            meta: {
                unlimited: bundle.unlimited,
                speed: bundle.speed,
            }
        };
    }

    @WithCircuitBreaker()
    async createOrder(orderData: CreateOrderDto): Promise<Order> {
        this.setupAuthHeader();
        try {
            // 1. Apply Bundle (Order)
            const applyPayload = {
                bundles: [
                    { name: orderData.packageId }
                ],
            };

            const applyResponse = await this.httpClient.post('/esims/apply', applyPayload);

            const appliedData = applyResponse.data;
            // API returns { esims: [{ iccid: string, status: string }], applyReference: string }
            const iccid = appliedData.esims?.[0]?.iccid;
            const appliedReference = appliedData.applyReference;

            if (!iccid) {
                throw new Error(`No ICCID returned from eSIM Go. Response: ${JSON.stringify(appliedData)}`);
            }

            // 2. Get Installation Details
            let installationDetails: any = {};
            if (appliedReference) {
                try {
                    const assignResponse = await this.httpClient.get('/esims/assignments', {
                        params: { reference: appliedReference }
                    });

                    // Handle potential array or single object response
                    let assignment;
                    if (Array.isArray(assignResponse.data)) {
                        assignment = assignResponse.data.find((a: any) => a.iccid === iccid);
                    } else {
                        assignment = assignResponse.data;
                    }

                    if (assignment && assignment.iccid === iccid) {
                        installationDetails = assignment;
                    }
                } catch (detailsError) {
                    this.logger.warn(`Failed to fetch assignment details for ${iccid}: ${detailsError.message}`);
                }
            }

            // Construct QR Code Data
            // If we don't get a direct URL, we construct the LPA string
            const qrCode = installationDetails.smdpAddress && installationDetails.matchingId
                ? `LPA:1$${installationDetails.smdpAddress}$${installationDetails.matchingId}`
                : '';

            return {
                id: appliedReference || iccid,
                providerId: 'esim-go',
                packageId: orderData.packageId,
                userId: orderData.userId,
                status: 'completed',
                totalAmount: 0,
                currency: 'USD',
                providerOrderId: appliedReference,
                createdAt: new Date(),
                updatedAt: new Date(),
                esim: {
                    id: iccid,
                    iccid: iccid,
                    status: 'active',
                    providerId: 'esim-go',
                    qrCode: qrCode,
                    activationCode: installationDetails.matchingId,
                    smdpAddress: installationDetails.smdpAddress,
                }
            };

        } catch (error) {
            this.logger.error(`Create Order Failed: ${error.message}`);
            throw error;
        }
    }

    @WithCircuitBreaker()
    async getPackageDetails(packageId: string): Promise<Package> {
        this.setupAuthHeader();
        const response = await this.httpClient.get(`/catalogue/bundle/${packageId}`);
        return this.mapToPackage(response.data);
    }

    async getOrderStatus(orderId: string): Promise<OrderStatus> {
        return {
            orderId,
            providerOrderId: orderId,
            status: 'completed',
            updatedAt: new Date()
        };
    }

    async activateESIM(esimId: string): Promise<ActivationResult> {
        return {
            esimId,
            iccid: esimId,
            status: 'active',
            qrCode: '',
            activatedAt: new Date()
        };
    }

    async getESIMDetails(esimId: string): Promise<ESIMDetails> {
        return {
            id: esimId,
            iccid: esimId,
            providerId: 'esim-go',
            status: 'active'
        };
    }

    async getQRCode(esimId: string): Promise<string> {
        return '';
    }
}
