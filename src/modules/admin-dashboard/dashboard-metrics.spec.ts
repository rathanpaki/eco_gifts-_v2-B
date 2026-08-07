import {
  averageOrder,
  dashboardWindows,
  percentageChange,
} from './dashboard-metrics';

describe('dashboard metrics', () => {
  it('calculates percentage change to one decimal place', () => {
    expect(percentageChange(125, 100)).toBe(25);
    expect(percentageChange(80, 100)).toBe(-20);
  });

  it('does not invent a percentage without a baseline', () => {
    expect(percentageChange(10, 0)).toBeNull();
    expect(percentageChange(0, 0)).toBe(0);
  });

  it('calculates average order values in integer cents', () => {
    expect(averageOrder(1000, 3)).toBe(333);
    expect(averageOrder(0, 0)).toBe(0);
  });

  it('uses non-overlapping UTC calendar-day reporting windows', () => {
    const windows = dashboardWindows(new Date('2026-08-06T15:30:00.000Z'));

    expect(windows.currentEnd.toISOString()).toBe('2026-08-07T00:00:00.000Z');
    expect(windows.currentStart.toISOString()).toBe('2026-07-08T00:00:00.000Z');
    expect(windows.previousStart.toISOString()).toBe(
      '2026-06-08T00:00:00.000Z',
    );
    expect(windows.trend.map((point) => point.date)).toEqual([
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
    ]);
  });
});
