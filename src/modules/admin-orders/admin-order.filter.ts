import type { FulfillmentStatus } from '../orders/order.types';

export const ADMIN_ORDER_FILTERS = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type AdminOrderFilter = (typeof ADMIN_ORDER_FILTERS)[number];

export function filterStatus(
  filter: AdminOrderFilter,
): FulfillmentStatus | null {
  return filter === 'all' ? null : filter;
}
