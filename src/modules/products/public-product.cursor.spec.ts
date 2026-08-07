import { BadRequestException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import {
  decodeProductCursor,
  encodeProductCursor,
} from './public-product.cursor';
import { publicProductFixture } from './public-product.fixture';

describe('public product cursor', () => {
  it('round trips a timestamp cursor', () => {
    const encoded = encodeProductCursor(
      'product-1',
      publicProductFixture(),
      'newest',
    );
    const [value, id] = decodeProductCursor(encoded, 'newest');
    expect(value).toBeInstanceOf(Timestamp);
    expect((value as Timestamp).toMillis()).toBe(1_700_000_100_000);
    expect(id).toBe('product-1');
  });

  it('binds a cursor to its original sort', () => {
    const encoded = encodeProductCursor(
      'product-1',
      publicProductFixture(),
      'price-asc',
    );
    expect(() => decodeProductCursor(encoded, 'newest')).toThrow(
      BadRequestException,
    );
    expect(() => decodeProductCursor('not-json', 'newest')).toThrow(
      BadRequestException,
    );
  });

  it('rejects values that do not match the cursor sort field', () => {
    const forged = Buffer.from(
      JSON.stringify({ v: 1, sort: 'price-asc', id: 'p1', value: 'cheap' }),
    ).toString('base64url');
    expect(() => decodeProductCursor(forged, 'price-asc')).toThrow(
      BadRequestException,
    );
  });
});
