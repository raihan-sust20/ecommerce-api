import { IsString, IsNumber, IsArray, IsEnum, IsOptional, Min, MinLength, ArrayMinSize, IsUUID } from 'class-validator';
import type { ProductStatus } from './create-product.dto';

export class UpdateProductDto {
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0, { message: 'Price must be greater than 0' })
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0, { message: 'Stock must be 0 or greater' })
  @IsOptional()
  stock?: number;

  @IsEnum(['active', 'inactive'], { message: 'Status must be either active or inactive' })
  @IsOptional()
  status?: ProductStatus;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category is required' })
  @IsUUID('4', { each: true, message: 'Each category ID must be a valid UUID' })
  @IsOptional()
  categoryIds?: string[];
}
