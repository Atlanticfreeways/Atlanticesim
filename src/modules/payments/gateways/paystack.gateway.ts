import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { PaymentGateway } from './payment-gateway.interface';

@Injectable()
export class PaystackGateway implements PaymentGateway {
  private readonly logger = new Logger(PaystackGateway.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    this.axiosInstance = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getName(): string {
    return 'paystack';
  }

  async createPayment(order: Order): Promise<{ checkoutUrl: string; transactionId: string }> {
    try {
      // Note: Paystack amount is in kobo (multiply by 100)
      const amount = Math.round(Number(order.paymentAmount) * 100);
      
      const response = await this.axiosInstance.post('/transaction/initialize', {
        email: (order.meta as any)?.email || 'customer@example.com', // fallback if email not in meta
        amount: amount,
        currency: order.paymentCurrency,
        reference: order.id,
        callback_url: `${this.configService.get('FRONTEND_URL')}/checkout/verify`,
        metadata: {
          orderId: order.id,
          userId: order.userId,
        },
      });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Paystack initialization failed');
      }

      return {
        checkoutUrl: response.data.data.authorization_url,
        transactionId: response.data.data.reference,
      };
    } catch (error) {
      this.logger.error(`Paystack payment creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get(`/transaction/verify/${transactionId}`);
      return response.data.status && response.data.data.status === 'success';
    } catch (error) {
      this.logger.error(`Paystack verification failed: ${error.message}`, error.stack);
      return false;
    }
  }

  async refundPayment(transactionId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/refund', {
        transaction: transactionId,
      });
      return response.data.status;
    } catch (error) {
      this.logger.error(`Paystack refund failed: ${error.message}`, error.stack);
      return false;
    }
  }
}
