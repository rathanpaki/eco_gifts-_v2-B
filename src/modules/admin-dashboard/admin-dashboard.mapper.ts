import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { RecentOrder, RevenuePoint } from './admin-dashboard.types';

export function buildTrend(
  base: RevenuePoint[],
  orders: DocumentData[],
): RevenuePoint[] {
  const totals = new Map(base.map((point) => [point.date, 0]));
  for (const order of orders) {
    if (!(order.createdAt instanceof Timestamp)) {
      throw new InternalServerErrorException('Order data is invalid.');
    }
    const date = order.createdAt.toDate().toISOString().slice(0, 10);
    if (totals.has(date)) {
      totals.set(date, (totals.get(date) ?? 0) + integer(order.totalCents));
    }
  }
  return base.map((point) => ({
    ...point,
    revenueCents: totals.get(point.date) ?? 0,
  }));
}

export function mapOrder(id: string, data: DocumentData): RecentOrder {
  return {
    id,
    orderNumber: optionalText(data.orderNumber) ?? id,
    customerName: optionalText(data.customerName),
    totalCents: integer(data.totalCents),
    currency: optionalText(data.currency),
    status:
      optionalText(data.fulfillmentStatus) ?? optionalText(data.paymentStatus),
  };
}

function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text || null;
}

function integer(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new InternalServerErrorException('Order data is invalid.');
  }
  return value as number;
}
