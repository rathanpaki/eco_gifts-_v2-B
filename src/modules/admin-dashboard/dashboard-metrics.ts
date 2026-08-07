import type { RevenuePoint } from './admin-dashboard.types';

export function percentageChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function averageOrder(
  revenueCents: number,
  paidOrderCount: number,
): number {
  return paidOrderCount ? Math.round(revenueCents / paidOrderCount) : 0;
}

export function dashboardWindows(now: Date): DashboardWindows {
  const currentEnd = nextUtcDay(now);
  const currentStart = daysBefore(currentEnd, 30);
  const trendStart = daysBefore(currentEnd, 7);
  return {
    currentStart,
    currentEnd,
    previousStart: daysBefore(currentStart, 30),
    trendStart,
    trend: emptyTrend(trendStart),
  };
}

function emptyTrend(start: Date): RevenuePoint[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC',
      }),
      revenueCents: 0,
    };
  });
}

function nextUtcDay(date: Date): Date {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function daysBefore(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

interface DashboardWindows {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  trendStart: Date;
  trend: RevenuePoint[];
}
