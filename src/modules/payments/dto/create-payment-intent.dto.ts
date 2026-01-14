import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;
}