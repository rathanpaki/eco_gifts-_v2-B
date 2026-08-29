import {
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { CardBrand, PaymentMethodValues } from '../account-saved.types';

export class WritePaymentMethodDto implements PaymentMethodValues {
  @IsString() @MinLength(2) @MaxLength(100) cardholderName!: string;
  @IsIn(['visa', 'mastercard', 'card']) brand!: CardBrand;
  @IsString() @Matches(/^\d{4}$/) lastFour!: string;
  @IsInt() @Min(1) @Max(12) expiryMonth!: number;
  @IsInt() @Min(2026) @Max(2100) expiryYear!: number;
  @IsBoolean() primary!: boolean;
}
