import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { CartImage } from './cart.types';

export function firstImage(value: unknown): CartImage | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    const result = image(entry);
    if (result) return result;
  }
  return null;
}

export function image(value: unknown): CartImage | null {
  const data = object(value);
  const url = text(data.url);
  const alt = text(data.alt);
  return url && alt ? { url, alt } : null;
}

export function object(value: unknown): DocumentData {
  return typeof value === 'object' && value !== null ? value : {};
}

export function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function integer(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}

export function currencyCode(value: unknown): string {
  const currency = text(value);
  return /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
}

export function timestamp(value: unknown): string {
  return value instanceof Timestamp ? value.toDate().toISOString() : '';
}
