import { IsString, Matches } from 'class-validator';

export class VerifyPhoneDto {
  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,24}$/)
  phone!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
