import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { VerifyImpactInput } from '../admin-impact.types';

export class VerifyImpactDto implements VerifyImpactInput {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  partnerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  partnerLocation?: string;

  @IsOptional()
  @IsDateString()
  plantedDate?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  certificateUrl?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  co2SequestrationKg?: number;
}
