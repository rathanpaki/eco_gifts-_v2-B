import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ProductStatus } from '../product-status.enum';

export class WriteProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  shortDescription!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category!: string;

  @IsString()
  @Matches(/^[A-Z0-9][A-Z0-9_-]{2,63}$/)
  sku!: string;

  @IsInt()
  @Min(0)
  @Max(100_000_000)
  priceCents!: number;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stockQuantity!: number;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  lowStockThreshold!: number;

  @IsBoolean()
  personalizationAvailable!: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  ecoScore!: number;

  @IsBoolean()
  materialsVerified!: boolean;

  @IsBoolean()
  packagingVerified!: boolean;

  @IsBoolean()
  contributionVerified!: boolean;

  @IsEnum(ProductStatus)
  status!: ProductStatus;
}
