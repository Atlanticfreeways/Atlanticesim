import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ProviderRouterService } from '../providers/provider-router.service';
import { UsersService } from '../users/users.service';
import { getQueueToken } from '@nestjs/bull';
import { OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let providersService: any;
  let providerRouter: any;
  let usersService: any;
  let activationQueue: any;

  const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test' };
  const mockPackageDetails = {
    id: 'pkg-1', title: '10GB Plan', dataAmount: 10, dataUnit: 'GB',
    wholesalePrice: 29.99, retailPrice: 29.99, currency: 'USD', isActive: true,
  };
  const mockOrder = {
    id: 'order-1', userId: 'user-1', packageId: 'pkg-1', providerId: 'airalo',
    status: OrderStatus.PENDING, paymentAmount: 29.99, paymentCurrency: 'USD',
    paymentMethod: 'card', createdAt: new Date(), updatedAt: new Date(),
    package: {}, provider: {}, esim: null,
  };

  beforeEach(async () => {
    prisma = {
      order: {
        create: jest.fn().mockResolvedValue(mockOrder),
        findMany: jest.fn().mockResolvedValue([mockOrder]),
        findFirst: jest.fn().mockResolvedValue(mockOrder),
        update: jest.fn().mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED }),
      },
    };
    providersService = {
      getAdapter: jest.fn().mockReturnValue({
        getPackageDetails: jest.fn().mockResolvedValue(mockPackageDetails),
      }),
    };
    providerRouter = {
      resolveOptimalProvider: jest.fn().mockResolvedValue('airalo'),
    };
    usersService = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };
    activationQueue = { add: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProvidersService, useValue: providersService },
        { provide: ProviderRouterService, useValue: providerRouter },
        { provide: UsersService, useValue: usersService },
        { provide: getQueueToken('activations'), useValue: activationQueue },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('createOrder', () => {
    it('should create order with explicit providerId', async () => {
      await service.createOrder('user-1', { packageId: 'pkg-1', providerId: 'airalo' });

      expect(providersService.getAdapter).toHaveBeenCalledWith('airalo');
      expect(providerRouter.resolveOptimalProvider).not.toHaveBeenCalled();
      expect(activationQueue.add).toHaveBeenCalledWith('activate-esim', expect.objectContaining({ providerId: 'airalo' }), expect.any(Object));
    });

    it('should auto-resolve provider when providerId is omitted', async () => {
      await service.createOrder('user-1', { packageId: 'pkg-1' });

      expect(providerRouter.resolveOptimalProvider).toHaveBeenCalled();
      expect(providersService.getAdapter).toHaveBeenCalledWith('airalo');
    });

    it('should throw NotFoundException for unknown user', async () => {
      usersService.findById.mockResolvedValue(null);
      await expect(service.createOrder('bad-user', { packageId: 'pkg-1', providerId: 'airalo' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when package not found', async () => {
      providersService.getAdapter.mockReturnValue({
        getPackageDetails: jest.fn().mockRejectedValue(new Error('not found')),
      });
      await expect(service.createOrder('user-1', { packageId: 'bad-pkg', providerId: 'airalo' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw when package is inactive', async () => {
      providersService.getAdapter.mockReturnValue({
        getPackageDetails: jest.fn().mockResolvedValue({ ...mockPackageDetails, isActive: false }),
      });
      await expect(service.createOrder('user-1', { packageId: 'pkg-1', providerId: 'airalo' }))
        .rejects.toThrow(/not active/);
    });

    it('should return existing order for duplicate idempotencyKey', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      const result = await service.createOrder('user-1', {
        packageId: 'pkg-1', providerId: 'airalo', idempotencyKey: 'dup-key',
      });
      expect(result).toEqual(mockOrder);
      expect(activationQueue.add).not.toHaveBeenCalled();
    });

    it('should enqueue activation job with exponential backoff', async () => {
      await service.createOrder('user-1', { packageId: 'pkg-1', providerId: 'airalo' });
      expect(activationQueue.add).toHaveBeenCalledWith(
        'activate-esim', expect.any(Object),
        expect.objectContaining({ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }),
      );
    });
  });

  describe('getUserOrders', () => {
    it('should return all user orders', async () => {
      const result = await service.getUserOrders('user-1');
      expect(result).toEqual([mockOrder]);
      expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }));
    });
  });

  describe('getOrderById', () => {
    it('should return order for authorized user', async () => {
      const result = await service.getOrderById('order-1', 'user-1');
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.getOrderById('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel PENDING order', async () => {
      prisma.order.findFirst.mockResolvedValue({ ...mockOrder, status: OrderStatus.PENDING });
      const result = await service.cancelOrder('order-1', 'user-1');
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should reject cancellation of COMPLETED order', async () => {
      prisma.order.findFirst.mockResolvedValue({ ...mockOrder, status: OrderStatus.COMPLETED });
      await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow('Order cannot be cancelled');
    });
  });
});
