import { BadRequestException } from '@nestjs/common';
import type { PublicProductsQueryDto } from './public-products.dto';
import type {
  PublicProductListInput,
  PublicProductSort,
} from './product.types';

export function normalizeProductQuery(
  query: PublicProductsQueryDto,
): PublicProductListInput {
  if (
    query.minPriceCents !== undefined &&
    query.maxPriceCents !== undefined &&
    query.minPriceCents > query.maxPriceCents
  ) {
    throw new BadRequestException(
      'minPriceCents cannot be greater than maxPriceCents.',
    );
  }
  const hasPriceBounds =
    query.minPriceCents !== undefined || query.maxPriceCents !== undefined;
  if (
    query.occasion &&
    (query.search ||
      query.category ||
      query.personalizable !== undefined ||
      hasPriceBounds)
  ) {
    throw new BadRequestException(
      'Occasion collections cannot be combined with catalog filters.',
    );
  }
  const sort = resolveSort(query.sort, hasPriceBounds);
  const hasFilters = Boolean(
    query.search ||
    query.category ||
    query.occasion ||
    query.personalizable !== undefined ||
    hasPriceBounds,
  );
  if (hasFilters && (sort === 'featured' || sort === 'name-asc')) {
    throw new BadRequestException(
      `${sort} sorting is available only without catalog filters.`,
    );
  }
  return {
    searchTokens: searchTokens(query.search),
    category: query.category?.trim(),
    occasion: query.occasion,
    minPriceCents: query.minPriceCents,
    maxPriceCents: query.maxPriceCents,
    personalizable: query.personalizable,
    sort,
    cursor: query.cursor,
    page: query.page ?? 1,
    limit: query.limit,
  };
}

function resolveSort(
  requested: PublicProductSort | undefined,
  hasPriceBounds: boolean,
): PublicProductSort {
  if (!hasPriceBounds) return requested ?? 'newest';
  if (!requested) return 'price-asc';
  if (requested === 'price-asc' || requested === 'price-desc') return requested;
  throw new BadRequestException(
    'Price filters require price-asc or price-desc sorting.',
  );
}

function searchTokens(search?: string): string[] {
  if (!search) return [];
  const tokens = Array.from(
    new Set(
      search
        .trim()
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 1),
    ),
  ).slice(0, 10);
  if (tokens.length === 0) {
    throw new BadRequestException('Search must contain letters or numbers.');
  }
  return tokens;
}
