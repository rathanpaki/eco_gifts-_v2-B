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
    offset: jest.fn(),
    limit: jest.fn(),
    count: jest.fn(),
    get: jest.fn(),
  };
  const countGet = jest.fn();
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
    query.offset.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.count.mockReturnValue({ get: countGet });
    countGet.mockResolvedValue({ data: () => ({ count: 31 }) });
    query.get.mockResolvedValue({ docs: [] });
    collection.mockReturnValue(query);
  });

  it('always scopes list queries to active products', async () => {
    await repository.list({
      searchTokens: ['soy', 'candle'],
      category: 'Home',
      occasion: 'wedding',
      personalizable: true,
      sort: 'newest',
      page: 1,
      limit: 20,
    });

    expect(collection).toHaveBeenCalledWith('products');
    expect(query.where).toHaveBeenCalledWith('status', '==', 'active');
    expect(query.where).toHaveBeenCalledWith('category', '==', 'Home');
    expect(query.where).toHaveBeenCalledWith(
      'occasions',
      'array-contains',
      'wedding',
    );
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

  it('uses the requested page offset and returns page metadata', async () => {
    const page = await repository.list({
      searchTokens: [],
      sort: 'newest',
      page: 2,
      limit: 12,
    });

    expect(query.offset).toHaveBeenCalledWith(12);
    expect(page).toMatchObject({
      page: 2,
      pageSize: 12,
      totalItems: 31,
      totalPages: 3,
    });
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
