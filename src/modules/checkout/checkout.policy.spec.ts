import { BadRequestException } from '@nestjs/common';
import type { AdminPromotion } from '../admin-promotions/admin-promotion.types';
import type { Cart } from '../cart/cart.types';
import { buildCheckoutQuote } from './checkout.policy';

const cart: Cart = {
  items: [
    {
      itemId: 'product-1',
      productId: 'product-1',
      slug: 'cedar-candle',
      name: 'Cedar candle',
      category: 'Home',
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
  personalizationCents: 0,
  totalCents: 5000,
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

  it('adds the Figma express delivery charge', () => {
    const quote = buildCheckoutQuote(cart, { deliveryId: 'express' });
    expect(quote.delivery.name).toBe('Express delivery');
    expect(quote.delivery.priceCents).toBe(1200);
    expect(quote.totalCents).toBe(6200);
  });

  it('includes saved personalization in the final total', () => {
    const personalized = {
      ...cart,
      personalizationCents: 600,
      totalCents: 5600,
    };
    const quote = buildCheckoutQuote(personalized, {});
    expect(quote.personalizationCents).toBe(600);
    expect(quote.totalCents).toBe(5600);
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

  it('includes a valid eco-contribution in the order total', () => {
    const quote = buildCheckoutQuote(cart, {
      contributionCause: 'Tree Planting',
      contributionAmountCents: 500,
    });
    expect(quote.totalCents).toBe(5500);
    expect(quote.ecoContribution).toEqual({
      cause: 'Tree Planting',
      amountCents: 500,
      rewardPointsEarned: 50,
      treeId: null,
    });
  });

  it('accepts the Carbon Offset quote used by the checkout screen', () => {
    const quote = buildCheckoutQuote(cart, {
      packagingId: 'seed-paper-wrap',
      contributionCause: 'Carbon Offset',
      contributionAmountCents: 500,
    });
    expect(quote.totalCents).toBe(5650);
    expect(quote.ecoContribution?.cause).toBe('Carbon Offset');
  });

  it('applies a validated reward voucher to the final total', () => {
    const quote = buildCheckoutQuote(
      cart,
      {},
      {
        voucherId: 'voucher_one',
        code: 'ECO-5-TEST',
        amountCents: 500,
      },
    );
    expect(quote.totalCents).toBe(4500);
    expect(quote.rewardDiscount?.amountCents).toBe(500);
  });

  it('requires the cause and amount to be selected together', () => {
    expect(() =>
      buildCheckoutQuote(cart, { contributionCause: 'Tree Planting' }),
    ).toThrow(BadRequestException);
  });
  it('applies an active percentage promotion to eligible products', () => {
    const promotion: AdminPromotion = {
      id: 'summer',
      name: 'Summer saving',
      code: 'SUMMER10',
      discountType: 'percentage',
      discountValue: 10,
      minimumBasketCents: 1000,
      appliesTo: 'collections',
      eligibleIds: ['Home'],
      startsAt: '2026-08-01T00:00:00.000Z',
      endsAt: '2026-09-01T00:00:00.000Z',
      status: 'active',
      redemptions: 0,
      attributedRevenueCents: 0,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };
    const quote = buildCheckoutQuote(
      cart,
      { promoCode: 'SUMMER10' },
      null,
      promotion,
    );
    expect(quote.promotionDiscount?.amountCents).toBe(500);
    expect(quote.totalCents).toBe(4500);
  });

  it('uses a free-delivery promotion against the selected delivery', () => {
    const promotion: AdminPromotion = {
      id: 'ship',
      name: 'Delivery on us',
      code: 'SHIPFREE',
      discountType: 'free_delivery',
      discountValue: 0,
      minimumBasketCents: 0,
      appliesTo: 'all',
      eligibleIds: [],
      startsAt: '2026-08-01T00:00:00.000Z',
      endsAt: '2026-09-01T00:00:00.000Z',
      status: 'active',
      redemptions: 0,
      attributedRevenueCents: 0,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };
    const quote = buildCheckoutQuote(
      cart,
      { deliveryId: 'express', promoCode: 'SHIPFREE' },
      null,
      promotion,
    );
    expect(quote.promotionDiscount?.amountCents).toBe(1200);
    expect(quote.totalCents).toBe(5000);
  });

  it('does not stack a reward voucher and promotion code', () => {
    expect(() =>
      buildCheckoutQuote(cart, { voucherId: 'reward', promoCode: 'SALE' }),
    ).toThrow('Choose either a reward voucher or a promotion code.');
  });
});
