import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { type PaymentProvider } from '../entities/payment.entity';

export class ProcessPaymentDto {
  @IsString()
  orderId: string;

  @IsEnum(['stripe', 'bkash'], {
    message: 'Provider must be either stripe or bkash',
  })
  provider: PaymentProvider;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
