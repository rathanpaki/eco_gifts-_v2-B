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
} from 'class-validator';
import type {
  CustomerConsentFilter,
  CustomerOrderFilter,
} from '../admin-customer.types';

const integer = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CustomerListQueryDto {
  @IsOptional()
  @IsIn(['any', 'opted-in', 'not-opted-in'])
  consent: CustomerConsentFilter = 'any';

  @IsOptional()
  @IsIn(['any', 'none', 'first-time', 'repeat'])
  orders: CustomerOrderFilter = 'any';

  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(120)
  @Matches(/^[^\p{Cc}]*$/u)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Matches(/^[A-Za-z0-9_-]+$/)
  cursor?: string;

  @IsOptional()
  @Transform(integer)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
