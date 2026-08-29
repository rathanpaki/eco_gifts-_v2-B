import { ConflictException, NotFoundException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { deliveryConfirmationDecision } from './delivery-confirmation.values';

describe('delivery confirmation decision', () => {
  it('allows the owner after admin delivery', () => {
    expect(
      deliveryConfirmationDecision(
        {
          userId: 'customer-1',
          fulfillmentStatus: 'delivered',
          deliveryConfirmationStatus: 'awaiting_customer',
        },
        'customer-1',
      ),
    ).toBe(true);
  });

  it('is idempotent after confirmation', () => {
    expect(
      deliveryConfirmationDecision(
        {
          userId: 'customer-1',
          fulfillmentStatus: 'delivered',
          deliveryConfirmationStatus: 'confirmed',
          deliveryConfirmedAt: Timestamp.now(),
        },
        'customer-1',
      ),
    ).toBe(false);
  });

  it('hides orders belonging to another customer', () => {
    expect(() =>
      deliveryConfirmationDecision(
        { userId: 'customer-2', fulfillmentStatus: 'delivered' },
        'customer-1',
      ),
    ).toThrow(NotFoundException);
  });

  it('rejects confirmation before delivery', () => {
    expect(() =>
      deliveryConfirmationDecision(
        { userId: 'customer-1', fulfillmentStatus: 'shipped' },
        'customer-1',
      ),
    ).toThrow(ConflictException);
  });
});
