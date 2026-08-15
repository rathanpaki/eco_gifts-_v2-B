import { InternalServerErrorException } from '@nestjs/common';
import {
  FieldValue,
  type DocumentData,
  type DocumentReference,
  type Timestamp,
  type Transaction,
} from 'firebase-admin/firestore';

export function recordDeliveredOrder(
  transaction: Transaction,
  userRef: DocumentReference,
  order: DocumentData,
  updatedAt: Timestamp,
): void {
  const impact = object(order.impact);
  transaction.set(
    userRef,
    {
      completedOrderCount: FieldValue.increment(1),
      lifetimeValueCents: FieldValue.increment(integer(order.totalCents)),
      impactPlasticAvoidedGrams: FieldValue.increment(
        integer(impact.plasticAvoidedGrams),
      ),
      impactCo2SavedKg: FieldValue.increment(number(impact.co2SavedKg)),
      updatedAt,
    },
    { merge: true },
  );
}

export function orderOwner(order: DocumentData): string {
  const value: unknown = order.userId;
  if (typeof value !== 'string' || !value.trim()) {
    throw new InternalServerErrorException('Stored order owner is invalid.');
  }
  return value;
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null)
    throw new InternalServerErrorException('Stored order impact is invalid.');
  return value as Record<string, unknown>;
}
function integer(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new InternalServerErrorException('Stored order value is invalid.');
  return value as number;
}
function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new InternalServerErrorException('Stored order impact is invalid.');
  return value;
}
