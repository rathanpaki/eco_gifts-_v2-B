import { BadRequestException } from '@nestjs/common';
import type { PaymentMethod } from '../orders/order.types';

export function assertCheckoutPaymentEnabled(
  method: PaymentMethod,
  demoCardPaymentsEnabled: boolean,
): void {
  if (method === 'demo_card' && !demoCardPaymentsEnabled) {
    throw new BadRequestException(
      'Card payment is unavailable in this environment.',
    );
  }
}
