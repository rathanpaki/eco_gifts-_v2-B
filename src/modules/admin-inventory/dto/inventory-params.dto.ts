import { IsString, Matches, MaxLength } from 'class-validator';

export class InventoryParamsDto {
  @IsString()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  productId!: string;
}
