import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { mapAdminProduct } from './admin-product.mapper';
import type { AdminProduct } from './admin-product.types';
import { productAudit } from './admin-product.values';
import { AdminProductsRepository } from './admin-products.repository';
import {
  ProductImageService,
  type UploadedProductImage,
} from './product-image.service';

@Injectable()
export class AdminProductImagesService {
  constructor(
    private readonly repository: AdminProductsRepository,
    private readonly storage: ProductImageService,
  ) {}

  async add(
    id: string,
    file: UploadedProductImage | undefined,
    alt: string,
    actor: AuthenticatedUser,
  ): Promise<AdminProduct> {
    const product = await this.get(id);
    if (product.images.length >= 8) {
      throw new BadRequestException('A product can have at most 8 images.');
    }
    const image = await this.storage.upload(id, file, alt);
    try {
      await this.repository.db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(this.repository.productRef(id));
        if (!snapshot.exists) throw new NotFoundException('Product not found.');
        const current = mapAdminProduct(snapshot.id, snapshot.data()!);
        if (current.images.length >= 8) {
          throw new BadRequestException('A product can have at most 8 images.');
        }
        const images = [...current.images, image];
        transaction.update(this.repository.productRef(id), {
          images,
          image: images[0],
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.create(
          this.repository.auditRef(),
          productAudit('product.image.added', actor, id),
        );
      });
    } catch (error) {
      await this.storage.remove(image.storagePath);
      throw error;
    }
    return this.get(id);
  }

  async remove(
    id: string,
    imageId: string,
    actor: AuthenticatedUser,
  ): Promise<AdminProduct> {
    const product = await this.get(id);
    const image = product.images.find((item) => item.id === imageId);
    if (!image) throw new NotFoundException('Product image not found.');
    const images = product.images.filter((item) => item.id !== imageId);
    const batch = this.repository.db.batch();
    batch.update(this.repository.productRef(id), {
      images,
      image: images[0] ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(
      this.repository.auditRef(),
      productAudit('product.image.removed', actor, id),
    );
    await batch.commit();
    await this.storage.remove(image.storagePath);
    return this.get(id);
  }

  async reorder(
    id: string,
    imageIds: string[],
    actor: AuthenticatedUser,
  ): Promise<AdminProduct> {
    const product = await this.get(id);
    if (
      imageIds.length !== product.images.length ||
      imageIds.some(
        (imageId) => !product.images.some((image) => image.id === imageId),
      )
    ) {
      throw new BadRequestException(
        'Image order must contain every product image once.',
      );
    }
    const images = imageIds.map((imageId) =>
      product.images.find((image) => image.id === imageId)!,
    );
    const batch = this.repository.db.batch();
    batch.update(this.repository.productRef(id), {
      images,
      image: images[0] ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(
      this.repository.auditRef(),
      productAudit('product.images.reordered', actor, id),
    );
    await batch.commit();
    return this.get(id);
  }

  private async get(id: string): Promise<AdminProduct> {
    const product = await this.repository.get(id);
    if (!product) throw new NotFoundException('Product not found.');
    return mapAdminProduct(product.id, product.data);
  }
}
