import type { Order } from '../orders/order.types';

export interface CustomerOrderStats {
  orderCount: number;
  completedOrderCount: number;
  lifetimeValueCents: number;
  impactPlasticAvoidedGrams: number;
  impactCo2SavedKg: number;
  lastOrderAt: string | null;
}

export function customerOrderStats(orders: Order[]): CustomerOrderStats {
  const paid = orders.filter((order) => order.paymentStatus === 'paid');
  return {
    orderCount: orders.length,
    completedOrderCount: paid.length,
    lifetimeValueCents: paid.reduce(
      (total, order) => total + order.totalCents,
      0,
    ),
    impactPlasticAvoidedGrams: paid.reduce(
      (total, order) => total + order.impact.plasticAvoidedGrams,
      0,
    ),
    impactCo2SavedKg: paid.reduce(
      (total, order) => total + order.impact.co2SavedKg,
      0,
    ),
    lastOrderAt: orders[0]?.createdAt ?? null,
  };
}
