import { Test, TestingModule } from '@nestjs/testing';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { PrismaService } from '../../config/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhookDispatcherService', () => {
  let service: WebhookDispatcherService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    webhookConfig: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookDispatcherService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WebhookDispatcherService>(WebhookDispatcherService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatch', () => {
    const userId = 'user-123';
    const event = 'order.completed';
    const payload = { orderId: 'order-456', status: 'completed' };

    const mockConfig = {
      userId,
      url: 'https://partner.example.com/webhook',
      secret: 'test-secret-key',
      isActive: true,
      events: ['order.completed', 'order.failed'],
    };

    it('should dispatch webhook successfully', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, payload);

      expect(mockPrismaService.webhookConfig.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should include HMAC signature in headers', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, payload);

      const callArgs = mockedAxios.post.mock.calls[0];
      const headers = callArgs[2].headers;

      expect(headers['X-Atlantic-Signature']).toBeDefined();
      expect(headers['X-Atlantic-Timestamp']).toBeDefined();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should generate correct HMAC signature', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, payload);

      const callArgs = mockedAxios.post.mock.calls[0];
      const body = callArgs[1] as string;
      const signature = callArgs[2].headers['X-Atlantic-Signature'];

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', mockConfig.secret)
        .update(body)
        .digest('hex');

      expect(signature).toBe(expectedSignature);
    });

    it('should include timestamp in payload', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, payload);

      const callArgs = mockedAxios.post.mock.calls[0];
      const body = JSON.parse(callArgs[1] as string);

      expect(body.timestamp).toBeDefined();
      expect(body.event).toBe(event);
      expect(body.data).toEqual(payload);
    });

    it('should not dispatch if config not found', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(null);

      await service.dispatch(userId, event, payload);

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should not dispatch if config is inactive', async () => {
      const inactiveConfig = { ...mockConfig, isActive: false };
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(inactiveConfig);

      await service.dispatch(userId, event, payload);

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should not dispatch if event not subscribed', async () => {
      const configWithDifferentEvents = {
        ...mockConfig,
        events: ['esim.activated', 'esim.expired'],
      };
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(configWithDifferentEvents);

      await service.dispatch(userId, event, payload);

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should dispatch if events array is empty (subscribe to all)', async () => {
      const configWithAllEvents = { ...mockConfig, events: [] };
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(configWithAllEvents);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, payload);

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should throw error on webhook delivery failure', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(service.dispatch(userId, event, payload)).rejects.toThrow('Network error');
    });

    it('should set 5 second timeout', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, payload);

      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[2].timeout).toBe(5000);
    });

    it('should handle different event types', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      const events = [
        'order.completed',
        'order.failed',
        'esim.activated',
        'esim.usage.warning',
      ];

      for (const evt of events) {
        const config = { ...mockConfig, events: [evt] };
        mockPrismaService.webhookConfig.findUnique.mockResolvedValue(config);
        
        await service.dispatch(userId, evt, payload);
      }

      expect(mockedAxios.post).toHaveBeenCalledTimes(events.length);
    });

    it('should handle complex payload objects', async () => {
      const complexPayload = {
        orderId: 'order-456',
        status: 'completed',
        esim: {
          iccid: '8901234567890123456',
          qrCode: 'data:image/png;base64,...',
        },
        metadata: {
          provider: 'airalo',
          package: 'usa-5gb',
        },
      };

      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, complexPayload);

      const callArgs = mockedAxios.post.mock.calls[0];
      const body = JSON.parse(callArgs[1] as string);

      expect(body.data).toEqual(complexPayload);
    });

    it('should handle webhook URL with query parameters', async () => {
      const configWithQueryParams = {
        ...mockConfig,
        url: 'https://partner.example.com/webhook?key=value&foo=bar',
      };

      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(configWithQueryParams);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, payload);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        configWithQueryParams.url,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should handle HTTP error responses', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      const error = new Error('Request failed with status code 500');
      (error as any).response = {
        status: 500,
        data: { error: 'Internal Server Error' },
      };
      mockedAxios.post.mockRejectedValue(error);

      await expect(service.dispatch(userId, event, payload)).rejects.toThrow('Request failed with status code 500');
    });

    it('should handle timeout errors', async () => {
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(mockConfig);
      const error = new Error('timeout of 5000ms exceeded');
      (error as any).code = 'ECONNABORTED';
      mockedAxios.post.mockRejectedValue(error);

      await expect(service.dispatch(userId, event, payload)).rejects.toThrow('timeout of 5000ms exceeded');
    });
  });

  describe('signature verification', () => {
    it('should generate different signatures for different timestamps', async () => {
      const userId = 'user-123';
      const event = 'test.event';
      const payload = { test: 'data' };
      const config = {
        userId,
        url: 'https://example.com/webhook',
        secret: 'test-secret',
        isActive: true,
        events: [],
      };

      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(config);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, payload);
      const body1 = JSON.parse(mockedAxios.post.mock.calls[0][1] as string);
      const signature1 = mockedAxios.post.mock.calls[0][2].headers['X-Atlantic-Signature'];

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      jest.clearAllMocks();
      mockPrismaService.webhookConfig.findUnique.mockResolvedValue(config);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.dispatch(userId, event, payload);
      const body2 = JSON.parse(mockedAxios.post.mock.calls[0][1] as string);
      const signature2 = mockedAxios.post.mock.calls[0][2].headers['X-Atlantic-Signature'];

      // Timestamps should be different
      expect(body1.timestamp).not.toBe(body2.timestamp);
      // Signatures should be different due to different timestamps
      expect(signature1).not.toBe(signature2);
    });
  });
});
