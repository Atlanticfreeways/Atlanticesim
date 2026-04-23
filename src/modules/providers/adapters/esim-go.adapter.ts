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
import { PackageClassifier } from '../../../common/utils/package-classifier.util';

import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class EsimGoAdapter extends BaseProviderAdapter {
    constructor(
        private configService: ConfigService,
        private prismaService: PrismaService,
        @Optional() httpClient?: AxiosInstance,
    ) {
        super(
            'esim-go',
            configService.get('ESIM_GO_BASE_URL') || 'https://api.esim-go.com/v2.4',
            '',
            httpClient,
            prismaService
        );
    }

    protected async setupAuthHeader(): Promise<void> {
        await super.setupAuthHeader();
        if (this.apiKey) {
            // eSIM Go uses X-API-Key header
            this.httpClient.defaults.headers.common['X-API-Key'] = this.apiKey;
            delete this.httpClient.defaults.headers.common['Authorization'];
        }
    }

    @WithCircuitBreaker()
    async searchPackages(filters: PackageFilters): Promise<Package[]> {
        await this.setupAuthHeader();
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
        const countries = bundle.countries?.map((c: any) => c.iso) || [];
        const hasData = bundle.allowances?.some((a: any) => a.type === 'DATA') ?? (bundle.dataAmount > 0);
        const hasVoice = bundle.allowances?.some((a: any) => a.type === 'VOICE') ?? false;
        const hasSms = bundle.allowances?.some((a: any) => a.type === 'SMS') ?? false;
        const isUnlimited = bundle.unlimited === true;

        const { packageType, scopeType } = PackageClassifier.classify({
            hasData, hasVoice, hasSms, isUnlimited, countries,
        });

        const voiceAllowance = bundle.allowances?.find((a: any) => a.type === 'VOICE');
        const smsAllowance = bundle.allowances?.find((a: any) => a.type === 'SMS');

        return {
            id: bundle.name,
            providerId: 'esim-go',
            providerName: 'eSIM Go',
            title: bundle.description || bundle.name,
            description: bundle.description || '',
            country: countries[0] || '',
            dataAmount: bundle.dataAmount || 0,
            dataUnit: 'MB',
            duration: bundle.duration || 0,
            wholesalePrice: bundle.price || 0,
            retailPrice: bundle.price || 0,
            currency: 'USD',
            coverage: countries,
            isActive: true,
            meta: {
                unlimited: isUnlimited,
                speed: bundle.speed,
                packageType,
                scopeType,
                voiceMinutes: voiceAllowance?.amount,
                smsCount: smsAllowance?.amount,
            }
        };
    }

    @WithCircuitBreaker()
    async createOrder(orderData: CreateOrderDto): Promise<Order> {
        await this.setupAuthHeader();
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
        await this.setupAuthHeader();
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
