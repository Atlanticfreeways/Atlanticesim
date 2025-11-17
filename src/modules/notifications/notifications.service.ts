import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendOrderConfirmation(email: string, orderData: any) {
    await this.transporter.sendMail({
      from: 'noreply@atlanticesim.com',
      to: email,
      subject: 'Order Confirmation - Atlantic eSIM',
      html: `
        <h2>Order Confirmed</h2>
        <p>Your eSIM order has been confirmed.</p>
        <p><strong>Order ID:</strong> ${orderData.id}</p>
        <p><strong>Package:</strong> ${orderData.package.name}</p>
        <p><strong>Amount:</strong> $${orderData.paymentAmount}</p>
      `,
    });
  }

  async sendEsimActivated(email: string, esimData: any) {
    await this.transporter.sendMail({
      from: 'noreply@atlanticesim.com',
      to: email,
      subject: 'eSIM Activated - Atlantic eSIM',
      html: `
        <h2>eSIM Activated</h2>
        <p>Your eSIM has been successfully activated.</p>
        <p><strong>ICCID:</strong> ${esimData.iccid}</p>
        <p>You can now use your eSIM for data and voice services.</p>
      `,
    });
  }
}