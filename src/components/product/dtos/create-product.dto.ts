import { IsString, IsNumber, IsArray, IsEnum, IsOptional, Min, MinLength, ArrayMinSize, IsUUID } from 'class-validator';

export type ProductStatus = 'active' | 'inactive';

export class CreateProductDto {
  @IsString()
  @MinLength(3, { message: 'SKU must be at least 3 characters' })
  sku: string;

  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  name: string;

  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  description: string;

  @IsNumber()
  @Min(0, { message: 'Price must be greater than 0' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'Stock must be 0 or greater' })
  stock: number;

  @IsEnum(['active', 'inactive'], { message: 'Status must be either active or inactive' })
  @IsOptional()
  status?: ProductStatus;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category is required' })
  @IsUUID('4', { each: true, message: 'Each category ID must be a valid UUID' })
  categoryIds: string[];
}
