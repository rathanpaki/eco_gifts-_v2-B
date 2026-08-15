import { Matches } from 'class-validator';

export class OrderParamsDto {
  @Matches(/^[A-Za-z0-9_-]{20,64}$/)
  orderId!: string;
}
