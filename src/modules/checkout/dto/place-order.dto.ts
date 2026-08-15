import { Type } from 'class-transformer';
import {
  Equals,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { DeliveryOptionId, PackagingOptionId } from '../checkout.types';

export class DeliveryAddressDto {
  @IsString() @MinLength(2) @MaxLength(100) fullName!: string;
  @IsString() @MinLength(3) @MaxLength(120) addressLine1!: string;
  @IsOptional() @IsString() @MaxLength(120) addressLine2?: string;
  @IsString() @MinLength(2) @MaxLength(80) city!: string;
  @IsOptional() @IsString() @MaxLength(80) region?: string;
  @IsString() @MinLength(2) @MaxLength(20) postalCode!: string;
  @IsString() @Length(2, 2) @Matches(/^[A-Z]{2}$/) countryCode!: string;
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,24}$/)
  phone?: string;
}

export class PlaceOrderDto {
  @IsUUID('4') idempotencyKey!: string;
  @IsIn(['recycled-box', 'seed-paper-wrap', 'zero-waste-cloth'])
  packagingId!: PackagingOptionId;
  @IsIn(['standard', 'green-logistics'])
  deliveryId!: DeliveryOptionId;
  @Equals('pay_on_delivery') paymentMethod!: 'pay_on_delivery';
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  address!: DeliveryAddressDto;
}
