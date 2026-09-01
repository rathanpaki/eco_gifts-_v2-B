import { Timestamp } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { Role } from '../../auth/role.enum';
import type { ProductWriteInput } from './admin-product.types';
import type { AdminProductsRepository } from './admin-products.repository';
import { AdminProductsService } from './admin-products.service';
import { ProductStatus } from './product-status.enum';

jest.mock('./admin-products.repository', () => ({
  AdminProductsRepository: class AdminProductsRepository {},
}));

describe('AdminProductsService transactional updates', () => {
  it('reads the current product and both SKU locks inside one transaction', async () => {
    const productReference = { id: 'product-1' };
    const previousSkuReference = { id: 'OLD-SKU' };
    const nextSkuReference = { id: 'NEW-SKU' };
    const auditReference = { id: 'audit-1' };
    const transaction = {
      get: jest.fn().mockResolvedValue(document(productData('OLD-SKU'))),
      getAll: jest
        .fn()
        .mockResolvedValue([
          lock(nextSkuReference, false),
          lock(previousSkuReference, true, 'product-1'),
        ]),
      set: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };
    const repository = repositoryWith(transaction, {
      productReference,
      previousSkuReference,
      nextSkuReference,
      auditReference,
    });
    const service = new AdminProductsService(repository);

    await service.update(
      'product-1',
      productInput({ sku: 'NEW-SKU' }),
      actor(),
    );

    expect(transaction.get).toHaveBeenCalledWith(productReference);
    expect(transaction.getAll).toHaveBeenCalledWith(
      nextSkuReference,
      previousSkuReference,
    );
    expect(transaction.set).toHaveBeenCalledWith(nextSkuReference, {
      productId: 'product-1',
    });
    expect(transaction.delete).toHaveBeenCalledWith(previousSkuReference);
    expect(transaction.update).toHaveBeenCalledWith(
      productReference,
      expect.objectContaining({ sku: 'NEW-SKU' }),
    );
  });

  it('does not overwrite a SKU lock owned by another product', async () => {
    const productReference = { id: 'product-1' };
    const previousSkuReference = { id: 'OLD-SKU' };
    const nextSkuReference = { id: 'NEW-SKU' };
    const transaction = {
      get: jest.fn().mockResolvedValue(document(productData('OLD-SKU'))),
      getAll: jest
        .fn()
        .mockResolvedValue([
          lock(nextSkuReference, true, 'product-2'),
          lock(previousSkuReference, true, 'product-1'),
        ]),
      set: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };
    const repository = repositoryWith(transaction, {
      productReference,
      previousSkuReference,
      nextSkuReference,
      auditReference: { id: 'audit-1' },
    });
    const service = new AdminProductsService(repository);

    await expect(
      service.update('product-1', productInput({ sku: 'NEW-SKU' }), actor()),
    ).rejects.toThrow('SKU already exists.');
    expect(transaction.update).not.toHaveBeenCalled();
  });
});

function repositoryWith(
  transaction: {
    get: jest.Mock;
    getAll: jest.Mock;
    set: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  },
  references: {
    productReference: object;
    previousSkuReference: object;
    nextSkuReference: object;
    auditReference: object;
  },
) {
  return {
    productRef: jest.fn().mockReturnValue(references.productReference),
    skuRef: jest.fn((sku: string) =>
      sku === 'NEW-SKU'
        ? references.nextSkuReference
        : references.previousSkuReference,
    ),
    auditRef: jest.fn().mockReturnValue(references.auditReference),
    get: jest.fn().mockResolvedValue({
      id: 'product-1',
      data: productData('NEW-SKU'),
    }),
    db: {
      runTransaction: jest.fn(
        async (callback: (value: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    },
  } as unknown as AdminProductsRepository;
}

function document(data: Record<string, unknown>) {
  return {
    exists: true,
    id: 'product-1',
    data: () => data,
  };
}

function lock(ref: object, exists: boolean, owner?: string) {
  return {
    exists,
    ref,
    get: (field: string) => (field === 'productId' ? owner : undefined),
  };
}

function productInput(
  overrides: Partial<ProductWriteInput> = {},
): ProductWriteInput {
  return {
    name: 'Product One',
    shortDescription: 'A short description',
    description: 'A complete product description.',
    category: 'Test gifts',
    occasions: ['birthday'],
    sku: 'OLD-SKU',
    priceCents: 2500,
    currency: 'USD',
    stockQuantity: 20,
    lowStockThreshold: 5,
    personalizationAvailable: true,
    ecoScore: 90,
    materialsVerified: true,
    packagingVerified: true,
    contributionVerified: true,
    status: ProductStatus.ACTIVE,
    ...overrides,
  };
}

function productData(sku: string) {
  return {
    ...productInput({ sku }),
    slug: 'product-one',
    lowStock: false,
    ecoEvidence: {
      materialsVerified: true,
      packagingVerified: true,
      contributionVerified: true,
    },
    ecoEvidenceComplete: true,
    images: [
      {
        id: 'image-1',
        url: 'https://storage.googleapis.com/product-one.jpg',
        storagePath: 'products/product-1/image-1.jpg',
        alt: 'Product one',
      },
    ],
    featuredRank: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

function actor(): AuthenticatedUser {
  return {
    uid: 'admin-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    emailVerified: true,
    role: Role.ADMIN,
    token: {} as AuthenticatedUser['token'],
  };
}
