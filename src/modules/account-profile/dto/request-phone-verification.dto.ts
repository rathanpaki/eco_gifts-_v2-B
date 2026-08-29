import { IsString, Matches } from 'class-validator';

export class RequestPhoneVerificationDto {
  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,24}$/)
  phone!: string;
}
