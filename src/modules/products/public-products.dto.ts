import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { PublicProductSort } from './product.types';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const integer = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return value;
  return Number(value);
};

const boolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class PublicProductsQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @Transform(integer)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  minPriceCents?: number;

  @IsOptional()
  @Transform(integer)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  maxPriceCents?: number;

  @IsOptional()
  @Transform(boolean)
  @IsBoolean()
  personalizable?: boolean;

  @IsOptional()
  @IsIn(['featured', 'newest', 'price-asc', 'price-desc', 'name-asc'])
  sort?: PublicProductSort;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  @Matches(/^[A-Za-z0-9_-]+$/)
  cursor?: string;

  @IsOptional()
  @Transform(integer)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}

export class PublicProductSlugDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;
}

export class FeaturedProductsQueryDto {
  @IsOptional()
  @Transform(integer)
  @IsInt()
  @Min(1)
  @Max(24)
  limit = 4;
}
