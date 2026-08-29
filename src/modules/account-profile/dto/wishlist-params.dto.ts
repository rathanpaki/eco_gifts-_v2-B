import { IsString, Matches } from 'class-validator';

export class WishlistParamsDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,150}$/)
  productId!: string;
}
