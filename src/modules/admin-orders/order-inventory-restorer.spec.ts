import type { DocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import { restoreOrderInventory } from './order-inventory-restorer';

describe('order inventory restorer', () => {
  it('restores ordered units and recalculates the low-stock flag', () => {
    const update = jest.fn();
    const reference = { id: 'product-1' };
    const product = {
      id: 'product-1',
      ref: reference,
      data: () => ({ stockQuantity: 2, lowStockThreshold: 4 }),
    } as unknown as DocumentSnapshot;

    restoreOrderInventory(
      { update } as unknown as Transaction,
      [product],
      new Map([['product-1', 5]]),
    );

    expect(update).toHaveBeenCalledWith(
      reference,
      expect.objectContaining({ stockQuantity: 7, lowStock: false }),
    );
  });

  it('rejects missing or malformed inventory documents', () => {
    const product = {
      id: 'product-1',
      ref: {},
      data: () => undefined,
    } as unknown as DocumentSnapshot;
    expect(() =>
      restoreOrderInventory(
        { update: jest.fn() } as unknown as Transaction,
        [product],
        new Map([['product-1', 1]]),
      ),
    ).toThrow('Stored inventory data is invalid.');
  });
});
