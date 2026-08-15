import { type DocumentData, Timestamp } from 'firebase-admin/firestore';
import type { OrderEventWrite } from './order-event.types';

export function orderEventValues(
  input: OrderEventWrite,
  createdAt: Timestamp,
): DocumentData {
  return {
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    note: input.note,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    actorType: input.actorType,
    createdAt,
  };
}
