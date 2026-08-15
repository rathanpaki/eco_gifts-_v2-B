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
import {
  ADMIN_ORDER_FILTERS,
  type AdminOrderFilter,
} from '../admin-order.filter';

const integer = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

export class AdminOrderListQueryDto {
  @IsOptional()
  @IsIn(ADMIN_ORDER_FILTERS)
  filter: AdminOrderFilter = 'all';

  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Matches(/^[A-Za-z0-9_-]+$/)
  cursor?: string;

  @IsOptional()
  @Transform(integer)
  @IsInt()
  @Min(1)
  @Max(24)
  limit = 12;
}
