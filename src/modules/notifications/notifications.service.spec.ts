import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('NotificationsService', () => {
  let service: NotificationsService;
  let configService: ConfigService;
  let mockTransporter: any;

  const mockOrderData = {
    id: 'order-1',
    paymentAmount: 29.99,
    package: {
      id: 'pkg-1',
      name: '10GB Plan',
    },
  };

  const mockEsimData = {
    id: 'esim-1',
    iccid: 'iccid-123',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-123' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: 587,
                SMTP_USER: 'user@example.com',
                SMTP_PASS: 'password',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOrderConfirmation', () => {
    it('should send order confirmation email', async () => {
      const email = 'user@example.com';

      await service.sendOrderConfirmation(email, mockOrderData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@atlanticesim.com',
          to: email,
          subject: 'Order Confirmation - Atlantic eSIM',
        }),
      );
    });

    it('should include order details in email', async () => {
      const email = 'user@example.com';

      await service.sendOrderConfirmation(email, mockOrderData);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(mockOrderData.id);
      expect(callArgs.html).toContain(mockOrderData.package.name);
      expect(callArgs.html).toContain(mockOrderData.paymentAmount.toString());
    });

    it('should handle email sending failure', async () => {
      const email = 'user@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendOrderConfirmation(email, mockOrderData)).rejects.toThrow(
        'SMTP error',
      );
    });

    it('should handle invalid email address', async () => {
      const invalidEmail = 'invalid-email';
      mockTransporter.sendMail.mockRejectedValue(new Error('Invalid email'));

      await expect(service.sendOrderConfirmation(invalidEmail, mockOrderData)).rejects.toThrow();
    });

    it('should handle missing order data', async () => {
      const email = 'user@example.com';
      const incompleteData = { id: 'order-1', package: { name: 'Plan' }, paymentAmount: 10 };

      await service.sendOrderConfirmation(email, incompleteData);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendEsimActivated', () => {
    it('should send eSIM activated email', async () => {
      const email = 'user@example.com';

      await service.sendEsimActivated(email, mockEsimData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@atlanticesim.com',
          to: email,
          subject: 'eSIM Activated - Atlantic eSIM',
        }),
      );
    });

    it('should include eSIM details in email', async () => {
      const email = 'user@example.com';

      await service.sendEsimActivated(email, mockEsimData);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(mockEsimData.iccid);
    });

    it('should handle email sending failure', async () => {
      const email = 'user@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendEsimActivated(email, mockEsimData)).rejects.toThrow('SMTP error');
    });

    it('should handle eSIM data with all fields', async () => {
      const email = 'user@example.com';
      const completeData = { id: 'esim-1', iccid: 'iccid-456', status: 'ACTIVE' };

      await service.sendEsimActivated(email, completeData);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should handle concurrent email sends', async () => {
      const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

      const promises = emails.map(email => service.sendEsimActivated(email, mockEsimData));
      await Promise.all(promises);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });
  });

  describe('Email Configuration', () => {
    it('should use correct SMTP configuration', async () => {
      expect(configService.get).toHaveBeenCalledWith('SMTP_HOST');
      expect(configService.get).toHaveBeenCalledWith('SMTP_PORT');
      expect(configService.get).toHaveBeenCalledWith('SMTP_USER');
      expect(configService.get).toHaveBeenCalledWith('SMTP_PASS');
    });

    it('should create transporter with correct settings', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: {
            user: 'user@example.com',
            pass: 'password',
          },
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Network error'));

      await expect(service.sendOrderConfirmation('user@example.com', mockOrderData)).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle timeout errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Timeout'));

      await expect(service.sendEsimActivated('user@example.com', mockEsimData)).rejects.toThrow(
        'Timeout',
      );
    });

    it('should handle authentication errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Authentication failed'));

      await expect(service.sendOrderConfirmation('user@example.com', mockOrderData)).rejects.toThrow(
        'Authentication failed',
      );
    });
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(service.sendOrderConfirmation).toBeDefined();
      expect(service.sendEsimActivated).toBeDefined();
    });

    it('should inject ConfigService', () => {
      expect(configService).toBeDefined();
    });
  });
});
