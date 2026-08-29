import { Type } from 'class-transformer';
import {
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Max,
  Min,
  MinLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import {
  CONTRIBUTION_CAUSES,
  type ContributionCause,
} from '../../eco-contribution/contribution.types';
import type { DeliveryOptionId, PackagingOptionId } from '../checkout.types';
import type { PaymentMethod } from '../../orders/order.types';

export class DeliveryAddressDto {
  @IsString() @MinLength(2) @MaxLength(100) fullName!: string;
  @IsString() @MinLength(3) @MaxLength(120) addressLine1!: string;
  @IsOptional() @IsString() @MaxLength(120) addressLine2?: string;
  @IsString() @MinLength(2) @MaxLength(80) city!: string;
  @IsOptional() @IsString() @MaxLength(80) region?: string;
  @IsString() @MinLength(2) @MaxLength(20) postalCode!: string;
  @IsString() @Length(2, 2) @Matches(/^[A-Z]{2}$/) countryCode!: string;
  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,24}$/)
  phone!: string;
}

export class PlaceOrderDto {
  @IsUUID('4') idempotencyKey!: string;
  @IsIn(['recycled-box', 'seed-paper-wrap', 'zero-waste-cloth'])
  packagingId!: PackagingOptionId;
  @IsIn(['standard', 'express', 'green-logistics'])
  deliveryId!: DeliveryOptionId;
  @IsIn(['pay_on_delivery', 'demo_card']) paymentMethod!: PaymentMethod;
  @ValidateIf(
    (order: PlaceOrderDto) =>
      order.contributionCause !== undefined ||
      order.contributionAmountCents !== undefined,
  )
  @IsIn(CONTRIBUTION_CAUSES)
  contributionCause?: ContributionCause;
  @ValidateIf(
    (order: PlaceOrderDto) =>
      order.contributionCause !== undefined ||
      order.contributionAmountCents !== undefined,
  )
  @IsInt()
  @Min(100)
  @Max(50_000)
  contributionAmountCents?: number;
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  voucherId?: string;
  @IsOptional()
  @IsString()
  @MaxLength(24)
  @Matches(/^[A-Za-z0-9_-]+$/)
  promoCode?: string;
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  address!: DeliveryAddressDto;
}
