import { IsString, IsBoolean, IsOptional, MinLength, Matches, IsUUID } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(2, { message: 'Slug must be at least 2 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only (e.g., electronics-phones)',
  })
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  @IsOptional()
  parentId?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
