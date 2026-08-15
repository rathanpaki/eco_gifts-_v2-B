import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type {
  AdminCustomerSummary,
  CustomerNote,
} from './admin-customer.types';

export function mapCustomerSummary(
  id: string,
  data: DocumentData,
): AdminCustomerSummary {
  const email = nullableText(data.email);
  return {
    id,
    displayName: nullableText(data.displayName) ?? email ?? 'Customer',
    email,
    orderCount: count(data.orderCount),
    completedOrderCount: count(data.completedOrderCount),
    lifetimeValueCents: count(data.lifetimeValueCents),
    lastOrderAt: nullableTimestamp(data.lastOrderAt),
    marketingOptIn: data.marketingOptIn === true,
    impactPlasticAvoidedGrams: count(data.impactPlasticAvoidedGrams),
    createdAt: timestamp(data.createdAt),
  };
}

export function mapCustomerNote(id: string, data: DocumentData): CustomerNote {
  return {
    id,
    body: requiredText(data.body),
    actorEmail: nullableText(data.actorEmail),
    createdAt: timestamp(data.createdAt),
  };
}

export function count(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}

export function finite(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

export function nullableTimestamp(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return timestamp(value);
}

function timestamp(value: unknown): string {
  if (!(value instanceof Timestamp)) return invalid();
  return value.toDate().toISOString();
}

function requiredText(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return invalid();
  return value;
}

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return invalid();
  return value.trim() || null;
}

function invalid(): never {
  throw new InternalServerErrorException('Stored customer data is invalid.');
}
