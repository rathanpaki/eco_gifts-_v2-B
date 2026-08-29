import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class WriteAddressDto {
  @IsString() @MinLength(2) @MaxLength(40) label!: string;
  @IsString() @MinLength(2) @MaxLength(100) fullName!: string;
  @IsString() @MinLength(2) @MaxLength(160) line1!: string;
  @IsOptional() @IsString() @MaxLength(160) line2?: string;
  @IsString() @MinLength(2) @MaxLength(100) city!: string;
  @IsOptional() @IsString() @MaxLength(80) region?: string;
  @IsString() @MinLength(2) @MaxLength(30) postalCode!: string;
  @IsString() @MinLength(2) @MaxLength(80) country!: string;
  @IsString() @Length(2, 2) @Matches(/^[A-Z]{2}$/) countryCode!: string;
  @IsString() @Matches(/^\+?[0-9 ()-]{7,24}$/) phone!: string;
  @IsBoolean() primary!: boolean;
}
