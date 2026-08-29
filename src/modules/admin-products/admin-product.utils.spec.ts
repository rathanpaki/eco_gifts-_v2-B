import { BadRequestException } from '@nestjs/common';
import {
  assertPublishable,
  evidenceComplete,
  imageSignatureAllowed,
  productSlug,
} from './admin-product.utils';
import { ProductStatus } from './product-status.enum';

const input = {
  name: 'Artisan Soy Candle',
  shortDescription: 'Small batch',
  description: 'Description',
  category: 'Candles',
  occasions: ['wedding'],
  sku: 'CANDLE-001',
  priceCents: 3400,
  currency: 'USD',
  stockQuantity: 12,
  lowStockThreshold: 4,
  personalizationAvailable: false,
  ecoScore: 98,
  materialsVerified: true,
  packagingVerified: true,
  contributionVerified: true,
  status: ProductStatus.ACTIVE,
};

describe('admin product utilities', () => {
  it('creates stable slugs', () => {
    expect(productSlug('  Café & Candle  ')).toBe('cafe-candle');
  });

  it('requires evidence and an image for publication', () => {
    expect(evidenceComplete(input)).toBe(true);
    expect(() => assertPublishable(input, 1)).not.toThrow();
    expect(() =>
      assertPublishable({ ...input, materialsVerified: false }, 1),
    ).toThrow(BadRequestException);
    expect(() => assertPublishable(input, 0)).toThrow(BadRequestException);
  });

  it('accepts only supported image signatures', () => {
    expect(imageSignatureAllowed(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
    expect(imageSignatureAllowed(Buffer.from('not-an-image'))).toBe(false);
  });
});
