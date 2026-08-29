import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type {
  InventoryEvent,
  InventoryEventType,
} from './admin-inventory.types';

export function mapInventoryEvent(data: DocumentData): InventoryEvent {
  return {
    id: text(data.id),
    productId: text(data.productId),
    productName: text(data.productName),
    orderId: optionalText(data.orderId),
    type: eventType(data.type),
    quantityDelta: integer(data.quantityDelta),
    stockBefore: nonnegative(data.stockBefore),
    stockAfter: nonnegative(data.stockAfter),
    reason: text(data.reason),
    actorId: text(data.actorId),
    actorEmail: optionalText(data.actorEmail),
    createdAt: timestamp(data.createdAt),
  };
}

function eventType(value: unknown): InventoryEventType {
  if (
    value === 'sale' ||
    value === 'sale_reversal' ||
    value === 'restock' ||
    value === 'adjustment'
  )
    return value;
  return invalid();
}
function text(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : invalid();
}
function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
function integer(value: unknown): number {
  return Number.isSafeInteger(value) ? (value as number) : invalid();
}
function nonnegative(value: unknown): number {
  const parsed = integer(value);
  return parsed >= 0 ? parsed : invalid();
}
function timestamp(value: unknown): string {
  return value instanceof Timestamp ? value.toDate().toISOString() : invalid();
}
function invalid(): never {
  throw new InternalServerErrorException('Stored inventory event is invalid.');
}
