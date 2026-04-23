import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ProviderRouterService } from '../providers/provider-router.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UsersService } from '../users/users.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private providerRouter: ProviderRouterService,
    private usersService: UsersService,
    @InjectQueue('activations') private activationQueue: Queue,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { packageId, paymentMethod, idempotencyKey } = createOrderDto;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await this.prisma.order.findFirst({
        where: { userId, meta: { path: ['idempotencyKey'], equals: idempotencyKey } },
        include: { package: true, provider: true, esim: true },
      });
      if (existing) return existing;
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // Auto-resolve provider if not specified
    const providerId = createOrderDto.providerId
      ?? await this.providerRouter.resolveOptimalProvider();

    const adapter = this.providersService.getAdapter(providerId);
    let packageDetails;
    try {
      packageDetails = await adapter.getPackageDetails(packageId);
    } catch {
      throw new NotFoundException(`Package ${packageId} not found with provider ${providerId}`);
    }

    if (!packageDetails.isActive) {
      throw new Error(`Package ${packageId} is currently not active`);
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        packageId,
        providerId,
        paymentAmount: packageDetails.retailPrice ?? packageDetails.wholesalePrice,
        paymentCurrency: packageDetails.currency,
        paymentMethod: paymentMethod || 'card',
        status: OrderStatus.PENDING,
        meta: idempotencyKey ? { idempotencyKey } : {},
      },
      include: { package: true, provider: true },
    });

    await this.activationQueue.add('activate-esim', {
      orderId: order.id,
      providerId,
      packageId,
      userEmail: user.email,
      userId,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });

    return order;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { package: true, provider: true, esim: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { package: true, provider: true, esim: true },
    });
    if (!order) throw new NotFoundException('Order not found');
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
