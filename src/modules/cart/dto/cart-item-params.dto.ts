import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CartItemParamsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(/^[^/]+$/)
  itemId!: string;
}
