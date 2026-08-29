import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  CONTRIBUTION_CAUSES,
  type ContributionCause,
} from '../../eco-contribution/contribution.types';
import type {
  CheckoutSelection,
  DeliveryOptionId,
  PackagingOptionId,
} from '../checkout.types';

const PACKAGING = ['recycled-box', 'seed-paper-wrap', 'zero-waste-cloth'];
const DELIVERY = ['standard', 'express', 'green-logistics'];
const integer = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

export class CheckoutSelectionDto implements CheckoutSelection {
  @IsOptional()
  @IsIn(PACKAGING)
  packagingId?: PackagingOptionId;

  @IsOptional()
  @IsIn(DELIVERY)
  deliveryId?: DeliveryOptionId;

  @ValidateIf(
    (selection: CheckoutSelectionDto) =>
      selection.contributionCause !== undefined ||
      selection.contributionAmountCents !== undefined,
  )
  @IsIn(CONTRIBUTION_CAUSES)
  contributionCause?: ContributionCause;

  @ValidateIf(
    (selection: CheckoutSelectionDto) =>
      selection.contributionCause !== undefined ||
      selection.contributionAmountCents !== undefined,
  )
  @Transform(integer)
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
}
