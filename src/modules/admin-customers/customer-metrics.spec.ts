import { customerMetrics } from './customer-metrics';

describe('customer metrics', () => {
  it('calculates only from recorded customer values', () => {
    expect(
      customerMetrics({
        total: 10,
        currentMonth: 3,
        previousMonth: 2,
        buyers: 8,
        repeatBuyers: 3,
        optedIn: 6,
        lifetimeValueCents: 74_200,
        completedOrders: 10,
      }),
    ).toEqual({
      totalCustomers: 10,
      monthlyChangePercent: 50,
      repeatPurchaseRate: 37.5,
      emailOptInRate: 60,
      averageOrderValueCents: 7420,
    });
  });

  it('handles an empty customer base without invalid percentages', () => {
    expect(
      customerMetrics({
        total: 0,
        currentMonth: 0,
        previousMonth: 0,
        buyers: 0,
        repeatBuyers: 0,
        optedIn: 0,
        lifetimeValueCents: 0,
        completedOrders: 0,
      }),
    ).toEqual(
      expect.objectContaining({
        monthlyChangePercent: null,
        repeatPurchaseRate: 0,
        emailOptInRate: 0,
        averageOrderValueCents: 0,
      }),
    );
  });
});
