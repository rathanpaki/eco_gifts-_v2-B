import { IsOptional, IsString, Matches } from 'class-validator';

export class WriteWishlistDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,128}$/)
  customizationId?: string;
}
