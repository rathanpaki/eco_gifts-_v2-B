import { BadRequestException } from '@nestjs/common';
import { normalizeProductQuery } from './public-product-query';

describe('public product query normalization', () => {
  it('normalizes search and applies safe defaults', () => {
    expect(
      normalizeProductQuery({ search: '  Soy Candle soy ', limit: 20 }),
    ).toMatchObject({
      searchTokens: ['soy', 'candle'],
      sort: 'newest',
      limit: 20,
    });
  });

  it('uses price ordering when a bound is supplied', () => {
    expect(normalizeProductQuery({ maxPriceCents: 5000, limit: 12 }).sort).toBe(
      'price-asc',
    );
  });

  it('rejects unsafe price ordering and inverted bounds', () => {
    expect(() =>
      normalizeProductQuery({
        maxPriceCents: 5000,
        sort: 'newest',
        limit: 20,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeProductQuery({
        minPriceCents: 5000,
        maxPriceCents: 1000,
        limit: 20,
      }),
    ).toThrow(BadRequestException);
  });

  it('allows composable filters only with indexed sorts', () => {
    expect(() =>
      normalizeProductQuery({
        search: 'candle',
        personalizable: true,
        sort: 'featured',
        limit: 20,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeProductQuery({
        category: 'Home',
        sort: 'name-asc',
        limit: 20,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeProductQuery({
        search: 'candle',
        category: 'Home',
        personalizable: true,
        sort: 'newest',
        limit: 20,
      }),
    ).not.toThrow();
  });
});
