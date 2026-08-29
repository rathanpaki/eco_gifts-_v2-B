import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { AdminSettings } from '../admin-settings.types';

export class UpdateAdminSettingsDto implements AdminSettings {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  storeName!: string;

  @IsEmail()
  supportEmail!: string;

  @IsBoolean()
  storefrontActive!: boolean;

  @IsBoolean()
  newOrderAlerts!: boolean;

  @IsBoolean()
  paymentFailureAlerts!: boolean;

  @IsBoolean()
  lowStockDigest!: boolean;

  @IsInt()
  @Min(1)
  @Max(10)
  handlingDays!: number;

  @IsBoolean()
  carbonNeutralDelivery!: boolean;

  @IsBoolean()
  requireAddressValidation!: boolean;

  @IsInt()
  @Min(5)
  @Max(1440)
  sessionTimeoutMinutes!: number;
}
