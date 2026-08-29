import { Timestamp } from 'firebase-admin/firestore';
import { mapDeliveryConfirmation } from './order-delivery.mapper';

describe('order delivery confirmation mapper', () => {
  it('does not request confirmation before delivery', () => {
    expect(mapDeliveryConfirmation({}, 'shipped')).toEqual({
      deliveryConfirmationStatus: 'not_ready',
      deliveryConfirmedAt: null,
    });
  });

  it('treats legacy delivered orders as awaiting customer confirmation', () => {
    expect(mapDeliveryConfirmation({}, 'delivered')).toEqual({
      deliveryConfirmationStatus: 'awaiting_customer',
      deliveryConfirmedAt: null,
    });
  });

  it('maps a completed customer confirmation', () => {
    const confirmedAt = Timestamp.fromDate(new Date('2026-08-23T12:00:00Z'));
    expect(
      mapDeliveryConfirmation(
        {
          deliveryConfirmationStatus: 'confirmed',
          deliveryConfirmedAt: confirmedAt,
        },
        'delivered',
      ),
    ).toEqual({
      deliveryConfirmationStatus: 'confirmed',
      deliveryConfirmedAt: '2026-08-23T12:00:00.000Z',
    });
  });
});
