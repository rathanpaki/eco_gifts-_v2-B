import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type {
  PromotionDiscountType,
  PromotionScope,
  PromotionWrite,
} from '../admin-promotion.types';

export class WritePromotionDto implements PromotionWrite {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name!: string;

  @IsString()
  @Matches(/^[A-Z0-9_-]{3,24}$/)
  code!: string;

  @IsIn(['percentage', 'fixed', 'free_delivery'])
  discountType!: PromotionDiscountType;

  @IsInt()
  @Min(0)
  @Max(100_000)
  discountValue!: number;

  @IsInt()
  @Min(0)
  @Max(10_000_000)
  minimumBasketCents!: number;

  @IsIn(['all', 'collections', 'products'])
  appliesTo!: PromotionScope;

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  eligibleIds!: string[];

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsIn(['draft', 'scheduled'])
  status!: 'draft' | 'scheduled';
}
