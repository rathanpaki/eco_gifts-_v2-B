import { Matches } from 'class-validator';

export class CustomerParamsDto {
  @Matches(/^[A-Za-z0-9_-]{20,128}$/)
  customerId!: string;
}
