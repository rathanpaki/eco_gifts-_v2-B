import { Timestamp } from 'firebase-admin/firestore';
import { aggregateInventorySales } from './inventory-sales.values';

describe('aggregateInventorySales', () => {
  const now = new Date('2026-08-23T12:00:00.000Z');

  it('uses sale and reversal events for current and previous periods', () => {
    const totals = aggregateInventorySales(
      [
        {
          productId: 'product_one',
          type: 'sale',
          quantityDelta: -5,
          createdAt: Timestamp.fromDate(new Date('2026-08-20T12:00:00Z')),
        },
        {
          productId: 'product_one',
          type: 'sale_reversal',
          quantityDelta: 2,
          createdAt: Timestamp.fromDate(new Date('2026-08-21T12:00:00Z')),
        },
        {
          productId: 'product_one',
          type: 'sale',
          quantityDelta: -4,
          createdAt: Timestamp.fromDate(new Date('2026-07-10T12:00:00Z')),
        },
        {
          productId: 'product_one',
          type: 'restock',
          quantityDelta: 30,
          createdAt: Timestamp.fromDate(new Date('2026-08-22T12:00:00Z')),
        },
      ],
      now,
    );

    expect(totals.get('product_one')).toEqual({ current: 3, previous: 4 });
  });
});
