import { IsString, MaxLength, MinLength } from 'class-validator';

export class ProductImageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  alt!: string;
}
