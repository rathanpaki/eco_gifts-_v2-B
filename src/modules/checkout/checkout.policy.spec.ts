import { BadRequestException } from '@nestjs/common';
import type { Cart } from '../cart/cart.types';
import { buildCheckoutQuote } from './checkout.policy';

const cart: Cart = {
  items: [
    {
      itemId: 'product-1',
      productId: 'product-1',
      slug: 'cedar-candle',
      name: 'Cedar candle',
      image: null,
      priceCents: 2500,
      currency: 'USD',
      quantity: 2,
      lineTotalCents: 5000,
      stockQuantity: 5,
      available: true,
      exceedsStock: false,
      personalizationAvailable: true,
      ecoScore: 80,
      customization: null,
    },
  ],
  totalQuantity: 2,
  subtotalCents: 5000,
  currency: 'USD',
  readyForCheckout: true,
  updatedAt: '2026-08-10T10:00:00.000Z',
};

describe('checkout policy', () => {
  it('calculates totals from the live cart and selected options', () => {
    const quote = buildCheckoutQuote(cart, {
      packagingId: 'seed-paper-wrap',
      deliveryId: 'green-logistics',
    });
    expect(quote.subtotalCents).toBe(5000);
    expect(quote.totalCents).toBe(5400);
    expect(quote.impact).toMatchObject({
      score: 95,
      grade: 'A+',
      estimated: true,
    });
  });

  it('rejects carts that cannot be fulfilled', () => {
    expect(() =>
      buildCheckoutQuote({ ...cart, readyForCheckout: false }, {}),
    ).toThrow(BadRequestException);
  });

  it('rejects unsupported option identifiers', () => {
    expect(() =>
      buildCheckoutQuote(cart, { packagingId: 'invalid' as never }),
    ).toThrow('Invalid checkout option.');
  });
});
