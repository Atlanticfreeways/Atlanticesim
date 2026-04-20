import { Controller, Post, Body, UseGuards, Request, Headers, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Payments')
@Controller('payments')
@Throttle({ default: { limit: 10, ttl: 60000 } }) // Max 10 requests per minute
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Create payment session/checkout URL' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-session')
  async createPaymentSession(
    @Request() req,
    @Body() dto: CreatePaymentSessionDto,
  ) {
    return this.paymentsService.createPaymentSession(
      dto.orderId,
      req.user.userId,
      dto.method,
    );
  }

  @ApiOperation({ summary: 'Verify payment status' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifyPayment(
    @Body('orderId') orderId: string,
  ) {
    return this.paymentsService.verifyPayment(orderId);
  }

  @ApiOperation({ summary: 'Payment Gateway Webhook' })
  @Post('webhook/:method')
  async handleWebhook(
    @Param('method') method: string,
    @Body() payload: any,
  ) {
    return this.paymentsService.handleWebhook(method, payload);
  }

  @ApiOperation({ summary: 'Refund payment' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('refund')
  async refundPayment(
    @Request() req,
    @Body('orderId') orderId: string,
  ) {
    return this.paymentsService.refundPayment(orderId, req.user.userId);
  }
}