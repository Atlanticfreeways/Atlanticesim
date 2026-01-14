import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Create new order' })
  @Post()
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.userId, createOrderDto);
  }

  @ApiOperation({ summary: 'Get user orders' })
  @Get()
  async getUserOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.userId);
  }

  @ApiOperation({ summary: 'Get order details' })
  @Get(':id')
  async getOrderById(@Param('id') id: string, @Request() req) {
    return this.ordersService.getOrderById(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Cancel order' })
  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancelOrder(id, req.user.userId);
  }
}