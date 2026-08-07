import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export type ProductFilter = 'all' | 'active' | 'draft' | 'low-stock';

export class ProductQueryDto {
  @IsOptional()
  @IsIn(['all', 'active', 'draft', 'low-stock'])
  filter: ProductFilter = 'all';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
