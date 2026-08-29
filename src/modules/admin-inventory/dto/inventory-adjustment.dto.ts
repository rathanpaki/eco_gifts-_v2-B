import {
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotEquals,
} from 'class-validator';
import type { InventoryAdjustmentInput } from '../admin-inventory.types';

export class InventoryAdjustmentDto implements InventoryAdjustmentInput {
  @IsIn(['restock', 'adjustment'])
  kind!: 'restock' | 'adjustment';

  @IsInt()
  @Min(-100_000)
  @Max(100_000)
  @NotEquals(0)
  quantityDelta!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  reason!: string;
}
