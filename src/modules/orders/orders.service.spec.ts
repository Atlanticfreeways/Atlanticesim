import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let providersService: ProvidersService;

  const mockOrder = {
    id: '1',
    userId: 'user-1',
    packageId: 'pkg-1',
    providerId: 'provider-1',
    paymentAmount: 29.99,
    paymentCurrency: 'USD',
    paymentMethod: 'card',
    status: OrderStatus.PROCESSING,
    transactionId: 'txn-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    package: {
      id: 'pkg-1',
      name: '10GB Plan',
      dataAmount: 10,
      dataUnit: 'GB',
      price: 29.99,
      currency: 'USD',
    },
    provider: {
      id: 'provider-1',
      name: 'Provider A',
    },
    esim: {
      id: 'esim-1',
      orderId: '1',
      userId: 'user-1',
      providerId: 'provider-1',
      iccid: 'iccid-123',
      qrCode: 'qr-code-123',
      smdpAddress: 'smdp.example.com',
      activationCode: 'act-code-123',
      dataTotal: 10240,
      status: 'ACTIVE',
    },
  };

  const mockPackageDetails = {
    id: 'pkg-1',
    name: '10GB Plan',
    dataAmount: 10,
    dataUnit: 'GB',
    price: 29.99,
    currency: 'USD',
  };

  const mockProviderOrder = {
    orderId: 'txn-123',
    esim: {
      iccid: 'iccid-123',
      qrCode: 'qr-code-123',
      smdpAddress: 'smdp.example.com',
      activationCode: 'act-code-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            eSim: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: ProvidersService,
          useValue: {
            getAdapter: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    providersService = module.get<ProvidersService>(ProvidersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const userId = 'user-1';
      const createOrderDto = {
        packageId: 'pkg-1',
        providerId: 'provider-1',
        paymentMethod: 'card',
      };

      const mockAdapter = {
        getPackageDetails: jest.fn().mockResolvedValue(mockPackageDetails),
        createOrder: jest.fn().mockResolvedValue(mockProviderOrder),
      };

      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);
      (prismaService.order.create as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
      });
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);
      (prismaService.eSim.create as jest.Mock).mockResolvedValue(mockOrder.esim);

      const result = await service.createOrder(userId, createOrderDto);

      expect(providersService.getAdapter).toHaveBeenCalledWith('provider-1');
      expect(mockAdapter.getPackageDetails).toHaveBeenCalledWith('pkg-1');
      expect(prismaService.order.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create eSIM when provider returns esim data', async () => {
      const userId = 'user-1';
      const createOrderDto = {
        packageId: 'pkg-1',
        providerId: 'provider-1',
        paymentMethod: 'card',
      };

      const mockAdapter = {
        getPackageDetails: jest.fn().mockResolvedValue(mockPackageDetails),
        createOrder: jest.fn().mockResolvedValue(mockProviderOrder),
      };

      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);
      (prismaService.order.create as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
      });
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);
      (prismaService.eSim.create as jest.Mock).mockResolvedValue(mockOrder.esim);

      await service.createOrder(userId, createOrderDto);

      expect(prismaService.eSim.create).toHaveBeenCalled();
    });

    it('should set order status to PROCESSING after provider confirmation', async () => {
      const userId = 'user-1';
      const createOrderDto = {
        packageId: 'pkg-1',
        providerId: 'provider-1',
        paymentMethod: 'card',
      };

      const mockAdapter = {
        getPackageDetails: jest.fn().mockResolvedValue(mockPackageDetails),
        createOrder: jest.fn().mockResolvedValue(mockProviderOrder),
      };

      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);
      (prismaService.order.create as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
      });
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);
      (prismaService.eSim.create as jest.Mock).mockResolvedValue(mockOrder.esim);

      await service.createOrder(userId, createOrderDto);

      expect(prismaService.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.PROCESSING,
          }),
        }),
      );
    });

    it('should set order status to FAILED if provider creation fails', async () => {
      const userId = 'user-1';
      const createOrderDto = {
        packageId: 'pkg-1',
        providerId: 'provider-1',
        paymentMethod: 'card',
      };

      const mockAdapter = {
        getPackageDetails: jest.fn().mockResolvedValue(mockPackageDetails),
        createOrder: jest.fn().mockRejectedValue(new Error('Provider error')),
      };

      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);
      (prismaService.order.create as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
      });
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.FAILED,
      });

      await expect(service.createOrder(userId, createOrderDto)).rejects.toThrow();
      expect(prismaService.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.FAILED,
          }),
        }),
      );
    });

    it('should use default payment method if not provided', async () => {
      const userId = 'user-1';
      const createOrderDto = {
        packageId: 'pkg-1',
        providerId: 'provider-1',
      };

      const mockAdapter = {
        getPackageDetails: jest.fn().mockResolvedValue(mockPackageDetails),
        createOrder: jest.fn().mockResolvedValue(mockProviderOrder),
      };

      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);
      (prismaService.order.create as jest.Mock).mockResolvedValue({
        ...mockOrder,
        paymentMethod: 'card',
      });
      (prismaService.order.update as jest.Mock).mockResolvedValue(mockOrder);
      (prismaService.eSim.create as jest.Mock).mockResolvedValue(mockOrder.esim);

      await service.createOrder(userId, createOrderDto);

      expect(prismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentMethod: 'card',
          }),
        }),
      );
    });
  });

  describe('getUserOrders', () => {
    it('should retrieve all user orders', async () => {
      const userId = 'user-1';
      const mockOrders = [mockOrder, { ...mockOrder, id: '2' }];

      (prismaService.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.getUserOrders(userId);

      expect(prismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          package: true,
          provider: true,
          esim: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockOrders);
      expect(result.length).toBe(2);
    });

    it('should return empty array if user has no orders', async () => {
      const userId = 'user-no-orders';

      (prismaService.order.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserOrders(userId);

      expect(result).toEqual([]);
    });

    it('should order results by creation date descending', async () => {
      const userId = 'user-1';

      (prismaService.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);

      await service.getUserOrders(userId);

      expect(prismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should include related package, provider, and esim data', async () => {
      const userId = 'user-1';

      (prismaService.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);

      const result = await service.getUserOrders(userId);

      expect(result[0]).toHaveProperty('package');
      expect(result[0]).toHaveProperty('provider');
      expect(result[0]).toHaveProperty('esim');
    });
  });

  describe('getOrderById', () => {
    it('should retrieve order by id for authorized user', async () => {
      const orderId = '1';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.getOrderById(orderId, userId);

      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: { id: orderId, userId },
        include: {
          package: true,
          provider: true,
          esim: true,
        },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      const orderId = 'nonexistent';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getOrderById(orderId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if order belongs to different user', async () => {
      const orderId = '1';
      const userId = 'different-user';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getOrderById(orderId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include related data in response', async () => {
      const orderId = '1';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.getOrderById(orderId, userId);

      expect(result).toHaveProperty('package');
      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('esim');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel PENDING order successfully', async () => {
      const orderId = '1';
      const userId = 'user-1';
      const pendingOrder = { ...mockOrder, status: OrderStatus.PENDING };

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(
        pendingOrder,
      );
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancelOrder(orderId, userId);

      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should cancel PROCESSING order successfully', async () => {
      const orderId = '1';
      const userId = 'user-1';
      const processingOrder = { ...mockOrder, status: OrderStatus.PROCESSING };

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(
        processingOrder,
      );
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...processingOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancelOrder(orderId, userId);

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw error if order is already completed', async () => {
      const orderId = '1';
      const userId = 'user-1';
      const completedOrder = { ...mockOrder, status: OrderStatus.COMPLETED };

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(
        completedOrder,
      );

      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow(
        'Order cannot be cancelled',
      );
    });

    it('should throw error if order is already cancelled', async () => {
      const orderId = '1';
      const userId = 'user-1';
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(
        cancelledOrder,
      );

      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow(
        'Order cannot be cancelled',
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      const orderId = 'nonexistent';
      const userId = 'user-1';

      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(service.createOrder).toBeDefined();
      expect(service.getUserOrders).toBeDefined();
      expect(service.getOrderById).toBeDefined();
      expect(service.cancelOrder).toBeDefined();
    });

    it('should inject PrismaService', () => {
      expect(prismaService).toBeDefined();
    });

    it('should inject ProvidersService', () => {
      expect(providersService).toBeDefined();
    });
  });
});
