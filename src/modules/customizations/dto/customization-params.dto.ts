import { Matches } from 'class-validator';

export class CustomizationParamsDto {
  @Matches(/^[A-Za-z0-9_-]{1,128}$/)
  customizationId!: string;
}
