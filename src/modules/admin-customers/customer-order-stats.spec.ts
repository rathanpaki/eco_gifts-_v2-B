import type { Order } from '../orders/order.types';
import { customerOrderStats } from './customer-order-stats';

describe('customer order stats', () => {
  it('counts revenue and impact only after payment is recorded', () => {
    const orders = [
      order('paid', 5000, 200, 1.5, '2026-08-10T00:00:00.000Z'),
      order('pending', 3000, 150, 0.8, '2026-08-12T00:00:00.000Z'),
    ];
    expect(customerOrderStats(orders)).toEqual({
      orderCount: 2,
      completedOrderCount: 1,
      lifetimeValueCents: 5000,
      impactPlasticAvoidedGrams: 200,
      impactCo2SavedKg: 1.5,
      lastOrderAt: '2026-08-10T00:00:00.000Z',
    });
  });
});

function order(
  paymentStatus: Order['paymentStatus'],
  totalCents: number,
  plasticAvoidedGrams: number,
  co2SavedKg: number,
  createdAt: string,
): Order {
  return {
    paymentStatus,
    totalCents,
    createdAt,
    impact: { plasticAvoidedGrams, co2SavedKg },
  } as Order;
}
