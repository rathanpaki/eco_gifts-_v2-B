export interface PeriodSummary {
  orderCount: number;
  paidOrderCount: number;
  revenueCents: number;
}

export interface RevenuePoint {
  date: string;
  label: string;
  revenueCents: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  totalCents: number;
  currency: string | null;
  status: string | null;
}

export interface AdminDashboard {
  generatedAt: string;
  periodDays: number;
  operator: { email: string | null; displayName: string | null };
  kpis: {
    revenueCents: number;
    revenueChangePercent: number | null;
    orderCount: number;
    orderChangePercent: number | null;
    averageOrderCents: number;
    averageChangePercent: number | null;
    openIssues: number;
  };
  attention: {
    paymentFailures: number;
    lowStockProducts: number;
    readyToShip: number;
  };
  revenueTrend: RevenuePoint[];
  recentOrders: RecentOrder[];
}
