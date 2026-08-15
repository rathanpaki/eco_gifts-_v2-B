import { InternalServerErrorException } from '@nestjs/common';
import type { FulfillmentStatus } from '../orders/order.types';

export function storedOrderStatus(value: unknown): FulfillmentStatus {
  if (
    value === 'pending' ||
    value === 'confirmed' ||
    value === 'processing' ||
    value === 'shipped' ||
    value === 'delivered' ||
    value === 'cancelled'
  )
    return value;
  throw new InternalServerErrorException('Stored order status is invalid.');
}
