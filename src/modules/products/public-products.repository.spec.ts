jest.mock('../../auth/firebase-admin.service', () => ({
  FirebaseAdminService: class FirebaseAdminService {},
}));

import type { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { PublicProductsRepository } from './public-products.repository';

describe('public products repository', () => {
  const query = {
    where: jest.fn(),
    orderBy: jest.fn(),
    startAfter: jest.fn(),
    limit: jest.fn(),
    get: jest.fn(),
  };
  const collection = jest.fn();
  const firebase = {
    firestore: { collection },
  } as unknown as FirebaseAdminService;
  const repository = new PublicProductsRepository(firebase);

  beforeEach(() => {
    jest.clearAllMocks();
    query.where.mockReturnValue(query);
    query.orderBy.mockReturnValue(query);
    query.startAfter.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.get.mockResolvedValue({ docs: [] });
    collection.mockReturnValue(query);
  });

  it('always scopes list queries to active products', async () => {
    await repository.list({
      searchTokens: ['soy', 'candle'],
      category: 'Home',
      personalizable: true,
      sort: 'newest',
      limit: 20,
    });

    expect(collection).toHaveBeenCalledWith('products');
    expect(query.where).toHaveBeenCalledWith('status', '==', 'active');
    expect(query.where).toHaveBeenCalledWith('category', '==', 'Home');
    expect(query.where).toHaveBeenCalledWith(
      'personalizationAvailable',
      '==',
      true,
    );
    expect(query.where).toHaveBeenCalledWith(
      'searchTerms',
      'array-contains-any',
      ['soy', 'candle'],
    );
    expect(query.limit).toHaveBeenCalledWith(21);
  });

  it('always scopes slug lookup to active products', async () => {
    query.get.mockResolvedValue({
      docs: [{ id: 'draft-1', data: () => ({ status: 'draft' }) }],
    });
    await repository.findBySlug('artisan-candle');
    expect(query.where).toHaveBeenCalledWith('slug', '==', 'artisan-candle');
    expect(query.limit).toHaveBeenCalledWith(1);
    await expect(repository.findBySlug('artisan-candle')).resolves.toBeNull();
  });
});
