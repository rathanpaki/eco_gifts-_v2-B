import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import type { FulfillmentStatus } from '../../orders/order.types';

export const FULFILLMENT_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateOrderStatusDto {
  @IsIn(FULFILLMENT_STATUSES)
  status!: FulfillmentStatus;

  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(300)
  @Matches(/^[^\p{Cc}]*$/u)
  note?: string;
}
