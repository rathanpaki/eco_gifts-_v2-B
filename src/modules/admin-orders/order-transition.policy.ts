import { ConflictException } from '@nestjs/common';
import type { FulfillmentStatus } from '../orders/order.types';

const transitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function allowedOrderTransitions(
  status: FulfillmentStatus,
): FulfillmentStatus[] {
  return [...transitions[status]];
}

export function assertOrderTransition(
  from: FulfillmentStatus,
  to: FulfillmentStatus,
): void {
  if (!transitions[from].includes(to)) {
    throw new ConflictException(
      `Order cannot move from ${from} to ${to}. Refresh and try again.`,
    );
  }
}

export function itemQuantities(items: unknown): Map<string, number> {
  if (!Array.isArray(items))
    throw new ConflictException('Order items are invalid.');
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (typeof item !== 'object' || item === null) invalidItems();
    const productId: unknown = Reflect.get(item, 'productId');
    const quantity: unknown = Reflect.get(item, 'quantity');
    if (
      typeof productId !== 'string' ||
      !productId ||
      !Number.isSafeInteger(quantity) ||
      (quantity as number) < 1
    )
      invalidItems();
    quantities.set(
      productId,
      (quantities.get(productId) ?? 0) + (quantity as number),
    );
  }
  if (!quantities.size) invalidItems();
  return quantities;
}

function invalidItems(): never {
  throw new ConflictException('Order items are invalid.');
}
