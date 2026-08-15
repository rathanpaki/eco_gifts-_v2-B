import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCustomizationDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,128}$/)
  productId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(12_000)
  designJson!: string;
}
