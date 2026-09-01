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
import { ProductStatus } from './product-status.enum';

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
    await this.get(id);
    const image = await this.storage.upload(id, file, alt);
    try {
      await this.repository.db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(this.repository.productRef(id));
        if (!snapshot.exists) throw new NotFoundException('Product not found.');
        const current = mapAdminProduct(snapshot.id, snapshot.data()!);
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
    const image = await this.repository.db.runTransaction(
      async (transaction) => {
        const productReference = this.repository.productRef(id);
        const snapshot = await transaction.get(productReference);
        if (!snapshot.exists) throw new NotFoundException('Product not found.');
        const product = mapAdminProduct(snapshot.id, snapshot.data()!);
        const selected = product.images.find((item) => item.id === imageId);
        if (!selected) throw new NotFoundException('Product image not found.');
        const images = product.images.filter((item) => item.id !== imageId);
        if (product.status === ProductStatus.ACTIVE && images.length === 0) {
          throw new BadRequestException(
            'Published products must keep at least one image.',
          );
        }
        transaction.update(productReference, {
          images,
          image: images[0] ?? null,
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.create(
          this.repository.auditRef(),
          productAudit('product.image.removed', actor, id),
        );
        return selected;
      },
    );
    await this.storage.remove(image.storagePath);
    return this.get(id);
  }

  async reorder(
    id: string,
    imageIds: string[],
    actor: AuthenticatedUser,
  ): Promise<AdminProduct> {
    await this.repository.db.runTransaction(async (transaction) => {
      const productReference = this.repository.productRef(id);
      const snapshot = await transaction.get(productReference);
      if (!snapshot.exists) throw new NotFoundException('Product not found.');
      const product = mapAdminProduct(snapshot.id, snapshot.data()!);
      const uniqueIds = new Set(imageIds);
      if (
        imageIds.length !== product.images.length ||
        uniqueIds.size !== imageIds.length ||
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
      transaction.update(productReference, {
        images,
        image: images[0] ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(
        this.repository.auditRef(),
        productAudit('product.images.reordered', actor, id),
      );
    });
    return this.get(id);
  }

  private async get(id: string): Promise<AdminProduct> {
    const product = await this.repository.get(id);
    if (!product) throw new NotFoundException('Product not found.');
    return mapAdminProduct(product.id, product.data);
  }
}
