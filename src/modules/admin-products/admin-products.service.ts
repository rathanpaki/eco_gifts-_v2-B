import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { mapAdminProduct } from './admin-product.mapper';
import type {
  AdminProduct,
  AdminProductPage,
  ProductWriteInput,
} from './admin-product.types';
import { assertPublishable, productSlug } from './admin-product.utils';
import { productAudit, productValues } from './admin-product.values';
import { AdminProductsRepository } from './admin-products.repository';
import type { ProductQueryDto } from './dto/product-query.dto';
import { ProductStatus } from './product-status.enum';

@Injectable()
export class AdminProductsService {
  constructor(private readonly repository: AdminProductsRepository) {}

  async list(query: ProductQueryDto): Promise<AdminProductPage> {
    const [page, metrics] = await Promise.all([
      this.repository.list(query),
      this.repository.metrics(),
    ]);
    return {
      items: page.docs.map((doc) => mapAdminProduct(doc.id, doc.data)),
      metrics,
      nextCursor: page.nextCursor || null,
    };
  }

  async get(id: string): Promise<AdminProduct> {
    this.assertId(id);
    const product = await this.repository.get(id);
    if (!product) throw new NotFoundException('Product not found.');
    return mapAdminProduct(product.id, product.data);
  }

  async create(input: ProductWriteInput, actor: AuthenticatedUser) {
    assertPublishable(input, 0);
    await this.assertSkuAvailable(input.sku);
    const ref = this.repository.newProductRef();
    const baseSlug = productSlug(input.name);
    const slug = (await this.repository.slugExists(baseSlug))
      ? `${baseSlug}-${ref.id.slice(0, 6).toLowerCase()}`
      : baseSlug;
    await this.repository.db.runTransaction(async (transaction) => {
      const [slugLock, skuLock] = await transaction.getAll(
        this.repository.slugRef(slug),
        this.repository.skuRef(input.sku),
      );
      if (slugLock.exists)
        throw new ConflictException('Product slug already exists.');
      if (skuLock.exists) throw new ConflictException('SKU already exists.');
      transaction.create(this.repository.slugRef(slug), { productId: ref.id });
      transaction.create(this.repository.skuRef(input.sku), {
        productId: ref.id,
      });
      transaction.create(ref, {
        ...productValues(input),
        slug,
        images: [],
        featuredRank: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(
        this.repository.auditRef(),
        productAudit('product.created', actor, ref.id),
      );
    });
    return this.get(ref.id);
  }

  async update(id: string, input: ProductWriteInput, actor: AuthenticatedUser) {
    const existing = await this.get(id);
    await this.assertSkuAvailable(input.sku, id);
    assertPublishable(input, existing.images.length);
    const inventoryChanged = existing.stockQuantity !== input.stockQuantity;
    await this.repository.db.runTransaction(async (transaction) => {
      const skuChanged = existing.sku !== input.sku;
      if (skuChanged) {
        const lock = await transaction.get(this.repository.skuRef(input.sku));
        if (lock.exists && lock.get('productId') !== id) {
          throw new ConflictException('SKU already exists.');
        }
        transaction.set(this.repository.skuRef(input.sku), { productId: id });
        transaction.delete(this.repository.skuRef(existing.sku));
      }
      transaction.update(this.repository.productRef(id), {
        ...productValues(input),
        featuredRank:
          input.status === ProductStatus.ACTIVE
            ? (existing.featuredRank ?? Date.now())
            : existing.featuredRank,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(this.repository.auditRef(), {
        ...productAudit('product.updated', actor, id),
        inventoryChanged,
        previousStock: existing.stockQuantity,
        stockQuantity: input.stockQuantity,
      });
    });
    return this.get(id);
  }

  async archive(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.get(id);
    const batch = this.repository.db.batch();
    batch.update(this.repository.productRef(id), {
      status: ProductStatus.ARCHIVED,
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(
      this.repository.auditRef(),
      productAudit('product.archived', actor, id),
    );
    await batch.commit();
  }

  private async assertSkuAvailable(sku: string, productId?: string) {
    const owner = await this.repository.skuOwner(sku.trim().toUpperCase());
    if (owner && owner !== productId)
      throw new ConflictException('SKU already exists.');
  }

  private assertId(id: string): void {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id))
      throw new BadRequestException('Invalid product id.');
  }
}
