import { IsString, Matches } from 'class-validator';

export class PromotionParamsDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,128}$/)
  promotionId!: string;
}
