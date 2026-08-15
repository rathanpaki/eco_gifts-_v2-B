import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import {
  calculateOptimalReorder,
  calculateSalesVelocity,
  calculateWasteMinimizationIndex,
} from './inventory-calculator';
import type { StockAnalytics } from './inventory-analytics.types';

export function mapStockAnalytics(
  productId: string,
  data: DocumentData,
): StockAnalytics {
  const currentStock = integer(data.stockQuantity);
  const allocatedStock = integer(data.allocatedStock);
  const availableStock = Math.max(0, currentStock - allocatedStock);
  const salesVelocity = calculateSalesVelocity(
    integer(data.unitsSold30d),
    30,
    integer(data.prevUnitsSold30d),
  );
  const leadTimeDays = positiveInteger(data.leadTimeDays, 7);
  const shelfLifeDays = optionalPositiveInteger(data.shelfLifeDays);
  return {
    productId,
    productName: text(data.name) ?? productId,
    category: text(data.category) ?? 'Uncategorized',
    currentStock,
    allocatedStock,
    availableStock,
    unitCostCents: optionalInteger(data.costCents),
    salesVelocity,
    reorder: calculateOptimalReorder(
      availableStock,
      salesVelocity.unitsSoldPerDay,
      leadTimeDays,
    ),
    wasteIndex: calculateWasteMinimizationIndex(
      availableStock,
      salesVelocity.unitsSoldPerDay,
      shelfLifeDays,
    ),
    lastRestockedAt: date(data.lastRestockedAt),
  };
}

function integer(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}
function optionalInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : null;
}
function positiveInteger(value: unknown, fallback: number): number {
  const parsed = optionalInteger(value);
  return parsed !== null && parsed > 0 ? parsed : fallback;
}
function optionalPositiveInteger(value: unknown): number | null {
  const parsed = optionalInteger(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}
function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
function date(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? new Date(value).toISOString()
    : null;
}
