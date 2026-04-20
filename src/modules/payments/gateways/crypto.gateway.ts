import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { PaymentGateway } from './payment-gateway.interface';

@Injectable()
export class CryptoGateway implements PaymentGateway {
  private readonly logger = new Logger(CryptoGateway.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('NOWPAYMENTS_API_KEY') || 'SANDBOX_KEY';
    this.axiosInstance = axios.create({
      baseURL: 'https://api.nowpayments.io/v1',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  getName(): string {
    return 'crypto';
  }

  async createPayment(order: Order): Promise<{ checkoutUrl: string; transactionId: string }> {
    try {
      // For Crypto, we often use USD as the base price
      const response = await this.axiosInstance.post('/payment', {
        price_amount: Number(order.paymentAmount),
        price_currency: 'usd',
        pay_currency: 'btc', // default to BTC, user can choose later on portal
        order_id: order.id,
        order_description: `Atlantic eSIM Order ${order.id}`,
        ipn_callback_url: `${this.configService.get('BACKEND_URL')}/api/v1/payments/webhook/crypto`,
        success_url: `${this.configService.get('FRONTEND_URL')}/checkout/success`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/checkout/cancel`,
      });

      return {
        checkoutUrl: response.data.invoice_url || response.data.payment_url,
        transactionId: response.data.payment_id.toString(),
      };
    } catch (error) {
      this.logger.error(`Crypto payment creation failed: ${error.message}`, error.stack);
      // Fallback for simulation if API key is missing
      if (this.configService.get('NODE_ENV') === 'development') {
         return {
            checkoutUrl: `https://mock-crypto-gateway.com/pay/${order.id}`,
            transactionId: `crypto_${order.id}`
         };
      }
      throw error;
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get(`/payment/${transactionId}`);
      return response.data.payment_status === 'finished' || response.data.payment_status === 'confirmed';
    } catch (error) {
      this.logger.error(`Crypto verification failed: ${error.message}`, error.stack);
      return false;
    }
  }

  async refundPayment(transactionId: string): Promise<boolean> {
    // Crypto refunds are complex and often manual. 
    // We log for administrator action.
    this.logger.warn(`Crypto refund requested for ${transactionId}. Manual intervention required.`);
    return false;
  }
}
