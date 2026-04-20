import { OrdersModule } from './orders.module';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private usersService: UsersService,
    @InjectQueue('activations') private activationQueue: Queue,
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

    // 2. Validate User
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // 3. Validate Package and Provider
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

    // 4. Create Accepted Order (Institutional: Respond fast, process background)
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

    // 5. Dispatch to BullMQ for Resilient Provider Activation
    await this.activationQueue.add('activate-esim', {
      orderId: order.id,
      providerId: providerId,
      packageId: packageId,
      userEmail: user.email,
      userId: userId,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
    });

    return order;
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