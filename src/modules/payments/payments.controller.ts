import { Controller, Post, Body, UseGuards, Request, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Create payment intent' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  async createPaymentIntent(
    @Request() req,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      createPaymentIntentDto.orderId,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: 'Stripe webhook' })
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(signature, req.rawBody);
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