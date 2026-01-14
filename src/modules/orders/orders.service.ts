import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { packageId, providerId, paymentMethod } = createOrderDto;

    // Get package details from provider
    const adapter = this.providersService.getAdapter(providerId);
    const packageDetails = await adapter.getPackageDetails(packageId);

    // Create order in database
    const order = await this.prisma.order.create({
      data: {
        userId,
        packageId,
        providerId,
        paymentAmount: packageDetails.price,
        paymentCurrency: packageDetails.currency,
        paymentMethod: paymentMethod || 'card',
        status: OrderStatus.PENDING,
      },
      include: {
        package: true,
        provider: true,
      },
    });

    // Create order with provider
    try {
      const providerOrder = await adapter.createOrder({
        packageId,
        userId,
        paymentMethod: paymentMethod || 'card',
      });

      // Update order with provider response
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PROCESSING,
          transactionId: providerOrder.orderId,
        },
        include: {
          package: true,
          provider: true,
        },
      });

      // Create eSIM if provided
      if (providerOrder.esim) {
        await this.prisma.eSim.create({
          data: {
            orderId: updatedOrder.id,
            userId,
            providerId,
            iccid: providerOrder.esim.iccid,
            qrCode: providerOrder.esim.qrCode,
            smdpAddress: providerOrder.esim.smdpAddress,
            activationCode: providerOrder.esim.activationCode,
            dataTotal: packageDetails.dataAmount * (packageDetails.dataUnit === 'GB' ? 1024 : 1),
          },
        });
      }

      return updatedOrder;
    } catch (error) {
      // Update order status to failed
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });
      throw error;
    }
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        package: true,
        provider: true,
        esim: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        package: true,
        provider: true,
        esim: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.getOrderById(orderId, userId);
    
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
      throw new Error('Order cannot be cancelled');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }
}