import { Timestamp } from 'firebase-admin/firestore';
import { mapCart, mapStoredCart } from './cart.mapper';

describe('cart mapper', () => {
  const stored = mapStoredCart({
    ownerId: 'guest-owner',
    ownerType: 'guest',
    updatedAt: Timestamp.fromDate(new Date('2026-08-07T10:00:00.000Z')),
    items: [
      {
        productId: 'product-1',
        quantity: 2,
        addedAt: '2026-08-07T09:00:00.000Z',
        product: {
          name: 'Cedar candle',
          slug: 'cedar-candle',
          currency: 'USD',
          image: { url: 'https://example.com/candle.jpg', alt: 'Cedar candle' },
        },
      },
    ],
  });

  it('uses current product price and stock for totals', () => {
    const cart = mapCart(stored, [
      {
        id: 'product-1',
        data: {
          status: 'active',
          name: 'Cedar candle',
          slug: 'cedar-candle',
          priceCents: 2500,
          currency: 'USD',
          stockQuantity: 4,
          ecoScore: 82,
          personalizationAvailable: true,
          images: [
            { url: 'https://example.com/current.jpg', alt: 'Candle jar' },
          ],
        },
      },
    ]);

    expect(cart.subtotalCents).toBe(5000);
    expect(cart.totalQuantity).toBe(2);
    expect(cart.readyForCheckout).toBe(true);
    expect(cart.items[0]).toMatchObject({
      itemId: 'product-1',
      available: true,
      exceedsStock: false,
    });
  });

  it('retains presentation data but removes unavailable items from totals', () => {
    const cart = mapCart(stored, []);

    expect(cart.items[0]).toMatchObject({
      name: 'Cedar candle',
      available: false,
    });
    expect(cart.subtotalCents).toBe(0);
    expect(cart.readyForCheckout).toBe(false);
  });

  it('preserves an owned customization as a distinct cart line', () => {
    const customized = mapStoredCart({
      ownerId: 'user-1',
      ownerType: 'user',
      items: [
        {
          itemId: 'customization-1',
          productId: 'product-1',
          quantity: 1,
          product: {
            name: 'Cedar candle',
            slug: 'cedar-candle',
            currency: 'USD',
          },
          customization: {
            id: 'customization-1',
            previewPath: '/api/customizations/customization-1/preview',
          },
        },
      ],
    });
    const cart = mapCart(customized, [
      {
        id: 'product-1',
        data: {
          status: 'active',
          priceCents: 2500,
          currency: 'USD',
          stockQuantity: 4,
          personalizationAvailable: true,
        },
      },
    ]);

    expect(cart.items[0]).toMatchObject({
      itemId: 'customization-1',
      productId: 'product-1',
      customization: { id: 'customization-1' },
    });
  });
});
