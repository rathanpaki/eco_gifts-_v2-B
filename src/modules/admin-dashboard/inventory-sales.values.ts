import { Timestamp, type DocumentData } from 'firebase-admin/firestore';

export interface InventorySalesPeriods {
  current: number;
  previous: number;
}

export function aggregateInventorySales(
  events: DocumentData[],
  now = new Date(),
): Map<string, InventorySalesPeriods> {
  const currentStart = new Date(now.getTime() - 30 * 86_400_000);
  const previousStart = new Date(now.getTime() - 60 * 86_400_000);
  const totals = new Map<string, InventorySalesPeriods>();
  events.forEach((event) => {
    const productId = text(event.productId);
    const createdAt = date(event.createdAt);
    const quantity = signedSalesQuantity(event.type, event.quantityDelta);
    if (!productId || !createdAt || quantity === null) return;
    const total = totals.get(productId) ?? { current: 0, previous: 0 };
    if (createdAt >= currentStart && createdAt <= now) {
      total.current += quantity;
    } else if (createdAt >= previousStart && createdAt < currentStart) {
      total.previous += quantity;
    }
    totals.set(productId, total);
  });
  totals.forEach((value) => {
    value.current = Math.max(0, value.current);
    value.previous = Math.max(0, value.previous);
  });
  return totals;
}

function signedSalesQuantity(type: unknown, delta: unknown): number | null {
  if (!Number.isSafeInteger(delta)) return null;
  if (type === 'sale') return Math.max(0, -(delta as number));
  if (type === 'sale_reversal') return -Math.max(0, delta as number);
  return null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function date(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  return null;
}
