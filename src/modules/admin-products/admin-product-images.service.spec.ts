import { Timestamp } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { Role } from '../../auth/role.enum';
import { AdminProductImagesService } from './admin-product-images.service';
import type { ProductImage } from './admin-product.types';
import type { AdminProductsRepository } from './admin-products.repository';
import type { ProductImageService } from './product-image.service';
import { ProductStatus } from './product-status.enum';

jest.mock('./admin-products.repository', () => ({
  AdminProductsRepository: class AdminProductsRepository {},
}));
jest.mock('./product-image.service', () => ({
  ProductImageService: class ProductImageService {},
}));

describe('AdminProductImagesService', () => {
  it('appends an image when the product already has twenty images', async () => {
    const currentImages = Array.from({ length: 20 }, image);
    const added = image(20);
    const currentData = productData(currentImages);
    const updatedData = productData([...currentImages, added]);
    const get = jest
      .fn()
      .mockResolvedValueOnce({ id: 'product-1', data: currentData })
      .mockResolvedValueOnce({ id: 'product-1', data: updatedData });
    let writtenImages: ProductImage[] = [];
    const update = jest.fn(
      (_reference: unknown, values: { images: ProductImage[] }) => {
        writtenImages = values.images;
      },
    );
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        id: 'product-1',
        data: () => currentData,
      }),
      update,
      create: jest.fn(),
    };
    const runTransaction = jest.fn(
      async (callback: (value: typeof transaction) => Promise<void>) =>
        callback(transaction),
    );
    const repository = {
      get,
      productRef: jest.fn().mockReturnValue({ id: 'product-1' }),
      auditRef: jest.fn().mockReturnValue({ id: 'audit-1' }),
      db: { runTransaction },
    } as unknown as AdminProductsRepository;
    const storage = {
      upload: jest.fn().mockResolvedValue(added),
      remove: jest.fn(),
    } as unknown as ProductImageService;
    const service = new AdminProductImagesService(repository, storage);

    const result = await service.add(
      'product-1',
      {} as never,
      'Additional view',
      actor(),
    );

    expect(result.images).toHaveLength(21);
    expect(update).toHaveBeenCalledTimes(1);
    expect(writtenImages).toHaveLength(21);
    expect(writtenImages.at(-1)).toEqual(added);
  });

  it('prevents removing the final image from a published product', async () => {
    const onlyImage = image(0);
    const remove = jest.fn();
    const update = jest.fn();
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        id: 'product-1',
        data: () => productData([onlyImage]),
      }),
      update,
      create: jest.fn(),
    };
    const runTransaction = jest.fn(
      async (callback: (value: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    const repository = {
      productRef: jest.fn().mockReturnValue({ id: 'product-1' }),
      auditRef: jest.fn().mockReturnValue({ id: 'audit-1' }),
      db: { runTransaction },
    } as unknown as AdminProductsRepository;
    const storage = { remove } as unknown as ProductImageService;
    const service = new AdminProductImagesService(repository, storage);

    await expect(
      service.remove('product-1', onlyImage.id, actor()),
    ).rejects.toThrow('Published products must keep at least one image.');
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('rejects duplicate ids when reordering product images', async () => {
    const images = [image(0), image(1)];
    const update = jest.fn();
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        id: 'product-1',
        data: () => productData(images),
      }),
      update,
      create: jest.fn(),
    };
    const repository = {
      productRef: jest.fn().mockReturnValue({ id: 'product-1' }),
      auditRef: jest.fn().mockReturnValue({ id: 'audit-1' }),
      db: {
        runTransaction: jest.fn(
          async (callback: (value: typeof transaction) => Promise<unknown>) =>
            callback(transaction),
        ),
      },
    } as unknown as AdminProductsRepository;
    const service = new AdminProductImagesService(
      repository,
      {} as ProductImageService,
    );

    await expect(
      service.reorder('product-1', [images[0].id, images[0].id], actor()),
    ).rejects.toThrow('Image order must contain every product image once.');
    expect(update).not.toHaveBeenCalled();
  });
});

function image(index: number): ProductImage {
  return {
    id: `image-${index}`,
    url: `https://storage.googleapis.com/image-${index}.jpg`,
    storagePath: `products/product-1/image-${index}.jpg`,
    alt: `Product view ${index + 1}`,
  };
}

function productData(images: ProductImage[]) {
  return {
    slug: 'product-one',
    name: 'Product One',
    shortDescription: 'A short description',
    description: 'A complete product description.',
    category: 'Test gifts',
    occasions: ['birthday'],
    sku: 'TEST-001',
    priceCents: 2500,
    currency: 'USD',
    stockQuantity: 20,
    lowStockThreshold: 5,
    lowStock: false,
    personalizationAvailable: true,
    ecoScore: 90,
    ecoEvidence: {
      materialsVerified: true,
      packagingVerified: true,
      contributionVerified: true,
    },
    ecoEvidenceComplete: true,
    images,
    status: ProductStatus.ACTIVE,
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
