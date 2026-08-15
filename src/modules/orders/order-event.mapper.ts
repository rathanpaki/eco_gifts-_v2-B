import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { StoredOrderEvent } from './order-event.types';
import type { FulfillmentStatus } from './order.types';

export function mapOrderEvent(
  id: string,
  data: DocumentData,
): StoredOrderEvent {
  return {
    id,
    status: status(data.toStatus),
    fromStatus: nullableStatus(data.fromStatus),
    note: optionalText(data.note),
    actorId: requiredText(data.actorId),
    actorEmail: optionalText(data.actorEmail),
    actorType: actorType(data.actorType),
    createdAt: timestamp(data.createdAt),
  };
}

function status(value: unknown): FulfillmentStatus {
  if (
    value === 'pending' ||
    value === 'confirmed' ||
    value === 'processing' ||
    value === 'shipped' ||
    value === 'delivered' ||
    value === 'cancelled'
  )
    return value;
  return invalid();
}

function nullableStatus(value: unknown): FulfillmentStatus | null {
  return value === null ? null : status(value);
}

function requiredText(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : invalid();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function actorType(value: unknown): 'user' | 'admin' {
  return value === 'user' || value === 'admin' ? value : invalid();
}

function timestamp(value: unknown): string {
  return value instanceof Timestamp ? value.toDate().toISOString() : invalid();
}

function invalid(): never {
  throw new InternalServerErrorException('Stored order event is invalid.');
}
