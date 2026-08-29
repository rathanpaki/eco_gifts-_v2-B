import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,24}$/)
  phone?: string;
}
