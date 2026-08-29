import { reviewEligibility } from './review-eligibility';

const delivered = {
  userId: 'user-1',
  fulfillmentStatus: 'delivered',
  deliveryConfirmationStatus: 'confirmed',
  items: [{ productId: 'product-1' }],
};

describe('review eligibility', () => {
  it('allows only confirmed delivered purchases', () => {
    expect(reviewEligibility(delivered, 'user-1', 'product-1')).toBeNull();
    expect(
      reviewEligibility(
        { ...delivered, deliveryConfirmationStatus: 'awaiting_customer' },
        'user-1',
        'product-1',
      ),
    ).toContain('Confirm delivery');
  });

  it('rejects another account or product', () => {
    expect(reviewEligibility(delivered, 'user-2', 'product-1')).toBe(
      'Order not found.',
    );
    expect(reviewEligibility(delivered, 'user-1', 'product-2')).toContain(
      'not part',
    );
  });
});
