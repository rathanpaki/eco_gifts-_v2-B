import { InternalServerErrorException } from '@nestjs/common';
import { mapPublicProduct } from './public-product.mapper';
import { publicProductFixture } from './public-product.fixture';

describe('public product mapper', () => {
  it('maps storefront data without leaking internal storage data', () => {
    const product = mapPublicProduct('product-1', publicProductFixture());

    expect(product).toMatchObject({
      id: 'product-1',
      slug: 'artisan-candle',
      stockQuantity: 6,
      inStock: true,
      lowStock: false,
    });
    expect(product.images[0]).toEqual({
      id: 'image-1',
      url: 'https://storage.googleapis.com/products/candle.webp',
      alt: 'Artisan candle in a glass jar',
    });
    expect(product.images[0]).not.toHaveProperty('storagePath');
  });

  it('derives inventory flags from current quantities', () => {
    const product = mapPublicProduct(
      'product-1',
      publicProductFixture({ stockQuantity: 0 }),
    );
    expect(product.inStock).toBe(false);
    expect(product.lowStock).toBe(true);
  });

  it('keeps the catalog available when a legacy product has no images', () => {
    const product = mapPublicProduct(
      'product-1',
      publicProductFixture({ images: [] }),
    );
    expect(product.images).toEqual([]);
  });

  it('rejects malformed numeric product data', () => {
    expect(() =>
      mapPublicProduct('product-1', publicProductFixture({ priceCents: -1 })),
    ).toThrow(InternalServerErrorException);
  });
});
