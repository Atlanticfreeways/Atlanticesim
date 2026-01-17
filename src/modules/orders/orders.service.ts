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
  ) { }

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { packageId, providerId, paymentMethod, idempotencyKey } = createOrderDto;

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existingOrder = await this.prisma.order.findFirst({
        where: {
          userId,
          meta: {
            path: ['idempotencyKey'],
            equals: idempotencyKey,
          },
        },
        include: { package: true, provider: true, esim: true },
      });

      if (existingOrder) {
        return existingOrder;
      }
    }

    // 2. Validate Package and Provider
    const adapter = this.providersService.getAdapter(providerId);
    let packageDetails;
    try {
      packageDetails = await adapter.getPackageDetails(packageId);
    } catch (error) {
      throw new NotFoundException(`Package ${packageId} not found with provider ${providerId}`);
    }

    if (!packageDetails.isActive) {
      throw new Error(`Package ${packageId} is currently not active`);
    }

    // 3. Create Pending Order
    const order = await this.prisma.order.create({
      data: {
        userId,
        packageId,
        providerId,
        paymentAmount: packageDetails.price,
        paymentCurrency: packageDetails.currency,
        paymentMethod: paymentMethod || 'card',
        status: OrderStatus.PENDING,
        meta: idempotencyKey ? { idempotencyKey } : {},
      },
      include: {
        package: true,
        provider: true,
      },
    });

    // 4. Process Order with Provider
    try {
      const providerOrder = await adapter.createOrder({
        packageId,
        userId,
        email: 'user@example.com', // TODO: Get from user profile
        quantity: 1
      });

      // 5. Update Order with Success
      const currentMeta = (order.meta as Record<string, any>) || {};
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PROCESSING,
          transactionId: providerOrder.providerOrderId,
          meta: { ...currentMeta, providerMeta: providerOrder.meta },
        },
        include: {
          package: true,
          provider: true,
        },
      });

      // 6. Handle eSIM creation
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
      // 7. Handle Failure
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.FAILED,
          meta: {
            ...(order.meta as Record<string, any>),
            error: error.message
          }
        },
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