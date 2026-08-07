import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { buildTrend, mapOrder } from './admin-dashboard.mapper';

describe('admin dashboard mapper', () => {
  it('does not fabricate absent optional order display values', () => {
    expect(mapOrder('order-1', { totalCents: 1299 })).toEqual({
      id: 'order-1',
      orderNumber: 'order-1',
      customerName: null,
      totalCents: 1299,
      currency: null,
      status: null,
    });
  });

  it('rejects malformed monetary or timestamp data', () => {
    expect(() => mapOrder('order-1', { totalCents: -1 })).toThrow(
      InternalServerErrorException,
    );
    expect(() =>
      buildTrend(
        [{ date: '2026-08-06', label: 'Wed', revenueCents: 0 }],
        [{ createdAt: 'bad', totalCents: 1299 }],
      ),
    ).toThrow(InternalServerErrorException);
  });

  it('assigns paid revenue to the matching UTC calendar day', () => {
    const trend = buildTrend(
      [{ date: '2026-08-06', label: 'Wed', revenueCents: 0 }],
      [
        {
          createdAt: Timestamp.fromDate(new Date('2026-08-06T23:59:59Z')),
          totalCents: 1299,
        },
      ],
    );

    expect(trend[0].revenueCents).toBe(1299);
  });
});
