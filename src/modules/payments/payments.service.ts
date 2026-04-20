import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { PaymentStatus, OrderStatus, Order } from '@prisma/client';
import { PaystackGateway } from './gateways/paystack.gateway';
import { CryptoGateway } from './gateways/crypto.gateway';
import { PaymentGateway } from './gateways/payment-gateway.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly gateways: Map<string, PaymentGateway> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly paystackGateway: PaystackGateway,
    private readonly cryptoGateway: CryptoGateway,
  ) {
    this.gateways.set('paystack', this.paystackGateway);
    this.gateways.set('crypto', this.cryptoGateway);
  }

  async createPaymentSession(orderId: string, userId: string, method: 'paystack' | 'crypto') {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { package: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const gateway = this.gateways.get(method);
    if (!gateway) {
      throw new BadRequestException(`Payment method ${method} not supported`);
    }

    const { checkoutUrl, transactionId } = await gateway.createPayment(order);

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: method,
        transactionId: transactionId,
      },
    });

    return { checkoutUrl, transactionId };
  }

  async verifyPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || !order.paymentMethod || !order.transactionId) {
      throw new NotFoundException('Order payment information not found');
    }

    const gateway = this.gateways.get(order.paymentMethod);
    const isValid = await gateway.verifyPayment(order.transactionId);

    if (isValid) {
      await this.handlePaymentSuccess(order);
    } else {
      await this.handlePaymentFailure(order);
    }

    return { success: isValid };
  }

  async handleWebhook(method: string, payload: any) {
    this.logger.log(`Received webhook for ${method}`);
    
    // Webhook logic varies by provider. 
    // In a production app, we would verify signatures here.
    
    let orderId: string;
    let success = false;

    if (method === 'paystack') {
      orderId = payload.data.reference;
      success = payload.event === 'charge.success';
    } else if (method === 'crypto') {
      orderId = payload.order_id;
      success = payload.payment_status === 'finished';
    }

    if (orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (order) {
        if (success) await this.handlePaymentSuccess(order);
        else await this.handlePaymentFailure(order);
      }
    }

    return { received: true };
  }

  private async handlePaymentSuccess(order: Order) {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        status: OrderStatus.CONFIRMED,
      },
    });
    this.logger.log(`Payment successful for order ${order.id}`);
  }

  private async handlePaymentFailure(order: Order) {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        status: OrderStatus.FAILED,
      },
    });
    this.logger.warn(`Payment failed for order ${order.id}`);
  }

  async refundPayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order || !order.transactionId || !order.paymentMethod) {
      throw new NotFoundException('Order or transaction not found');
    }

    const gateway = this.gateways.get(order.paymentMethod);
    const success = await gateway.refundPayment(order.transactionId);

    if (success) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: OrderStatus.REFUNDED,
        },
      });
    }

    return { success };
  }
}