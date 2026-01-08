import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import type { OrderStatus } from '../entities/order.entity';

export class GetOrdersQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['pending', 'paid', 'canceled'], {
    message: 'Status must be one of: pending, paid, canceled',
  })
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  userId?: string;
}
