import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ProductReviewParamsDto {
  @Matches(/^[A-Za-z0-9_-]{1,128}$/)
  productId!: string;
}

export class OrderReviewParamsDto {
  @Matches(/^[A-Za-z0-9_-]{20,64}$/)
  orderId!: string;
}

export class ProductReviewQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
  )
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}

export class CreateProductReviewDto {
  @Matches(/^[A-Za-z0-9_-]{20,64}$/)
  orderId!: string;

  @Matches(/^[A-Za-z0-9_-]{1,128}$/)
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  title?: string;

  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment!: string;
}
