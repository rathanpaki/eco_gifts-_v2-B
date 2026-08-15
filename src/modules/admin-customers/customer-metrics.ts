import type { AdminCustomerMetrics } from './admin-customer.types';

export interface CustomerMetricValues {
  total: number;
  currentMonth: number;
  previousMonth: number;
  buyers: number;
  repeatBuyers: number;
  optedIn: number;
  lifetimeValueCents: number;
  completedOrders: number;
}

export function customerMetrics(
  values: CustomerMetricValues,
): AdminCustomerMetrics {
  return {
    totalCustomers: values.total,
    monthlyChangePercent: percentageChange(
      values.currentMonth,
      values.previousMonth,
    ),
    repeatPurchaseRate: percentage(values.repeatBuyers, values.buyers),
    emailOptInRate: percentage(values.optedIn, values.total),
    averageOrderValueCents: values.completedOrders
      ? Math.round(values.lifetimeValueCents / values.completedOrders)
      : 0,
  };
}

export function customerMetricWindow(now: Date) {
  const currentStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const previousStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  return { currentStart, previousStart };
}

function percentage(part: number, total: number): number {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function percentageChange(current: number, previous: number): number | null {
  if (!previous) return current ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
