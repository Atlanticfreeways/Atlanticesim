import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentSessionDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ enum: ['paystack', 'crypto'] })
  @IsEnum(['paystack', 'crypto'])
  method: 'paystack' | 'crypto';
}
