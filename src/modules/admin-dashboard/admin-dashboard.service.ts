import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import {
  averageOrder,
  dashboardWindows,
  percentageChange,
} from './dashboard-metrics';
import { buildTrend, mapOrder } from './admin-dashboard.mapper';
import { AdminDashboardRepository } from './admin-dashboard.repository';
import type { AdminDashboard } from './admin-dashboard.types';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly repository: AdminDashboardRepository) {}

  async get(user: AuthenticatedUser): Promise<AdminDashboard> {
    const now = new Date();
    const windows = dashboardWindows(now);
    const [
      current,
      previous,
      failures,
      lowStock,
      ready,
      weekly,
      orders,
      operator,
    ] = await Promise.all([
      this.repository.period(windows.currentStart, windows.currentEnd),
      this.repository.period(windows.previousStart, windows.currentStart),
      this.repository.count('orders', 'paymentStatus', 'failed'),
      this.repository.count('products', 'lowStock', true),
      this.repository.count('orders', 'fulfillmentStatus', 'ready_to_ship'),
      this.repository.weeklyPaidOrders(windows.trendStart, windows.currentEnd),
      this.repository.recentOrders(5),
      Promise.resolve({ email: user.email, displayName: user.displayName }),
    ]);
    const currentAverage = averageOrder(
      current.revenueCents,
      current.paidOrderCount,
    );
    const previousAverage = averageOrder(
      previous.revenueCents,
      previous.paidOrderCount,
    );
    return {
      generatedAt: now.toISOString(),
      periodDays: 30,
      operator,
      kpis: {
        revenueCents: current.revenueCents,
        revenueChangePercent: percentageChange(
          current.revenueCents,
          previous.revenueCents,
        ),
        orderCount: current.orderCount,
        orderChangePercent: percentageChange(
          current.orderCount,
          previous.orderCount,
        ),
        averageOrderCents: currentAverage,
        averageChangePercent: percentageChange(currentAverage, previousAverage),
        openIssues: failures,
      },
      attention: {
        paymentFailures: failures,
        lowStockProducts: lowStock,
        readyToShip: ready,
      },
      revenueTrend: buildTrend(windows.trend, weekly),
      recentOrders: orders.map((order) => mapOrder(order.id, order.data)),
    };
  }
}
