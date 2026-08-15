import { ConflictException } from '@nestjs/common';
import {
  allowedOrderTransitions,
  assertOrderTransition,
  itemQuantities,
} from './order-transition.policy';

describe('order transition policy', () => {
  it('allows the fulfillment path and pre-shipment cancellation', () => {
    expect(allowedOrderTransitions('pending')).toEqual([
      'confirmed',
      'cancelled',
    ]);
    expect(() => assertOrderTransition('processing', 'shipped')).not.toThrow();
  });

  it.each([
    ['pending', 'shipped'],
    ['shipped', 'cancelled'],
    ['delivered', 'processing'],
    ['cancelled', 'confirmed'],
  ] as const)('rejects %s to %s', (from, to) => {
    expect(() => assertOrderTransition(from, to)).toThrow(ConflictException);
  });

  it('aggregates quantities before restoring inventory', () => {
    expect([
      ...itemQuantities([
        { productId: 'p1', quantity: 2 },
        { productId: 'p1', quantity: 1 },
        { productId: 'p2', quantity: 4 },
      ]),
    ]).toEqual([
      ['p1', 3],
      ['p2', 4],
    ]);
  });
});
