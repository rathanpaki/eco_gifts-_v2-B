jest.mock('./public-products.repository', () => ({
  PublicProductsRepository: class PublicProductsRepository {},
}));

import { NotFoundException } from '@nestjs/common';
import { publicProductFixture } from './public-product.fixture';
import { PublicProductsRepository } from './public-products.repository';
import { PublicProductsService } from './public-products.service';

describe('public products service', () => {
  const repository = {
    list: jest.fn(),
    findBySlug: jest.fn(),
  };
  const service = new PublicProductsService(
    repository as unknown as PublicProductsRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns a stable mapped page', async () => {
    repository.list.mockResolvedValue({
      docs: [{ id: 'product-1', data: publicProductFixture() }],
      nextCursor: 'next-page',
      page: 2,
      pageSize: 10,
      totalItems: 11,
      totalPages: 2,
    });

    const page = await service.list({ limit: 10 });

    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'newest', limit: 10 }),
    );
    expect(page.items[0].slug).toBe('artisan-candle');
    expect(page.nextCursor).toBe('next-page');
    expect(page).toMatchObject({
      page: 2,
      pageSize: 10,
      totalItems: 11,
      totalPages: 2,
    });
  });

  it('returns only the product found by the active repository lookup', async () => {
    repository.findBySlug.mockResolvedValue({
      id: 'product-1',
      data: publicProductFixture(),
    });
    await expect(service.getBySlug('artisan-candle')).resolves.toMatchObject({
      id: 'product-1',
      slug: 'artisan-candle',
    });
  });

  it('returns 404 for absent or inactive product slugs', async () => {
    repository.findBySlug.mockResolvedValue(null);
    await expect(service.getBySlug('draft-product')).rejects.toThrow(
      NotFoundException,
    );
  });
});
