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
      page: page.page,
      pageSize: page.pageSize,
      totalItems: page.totalItems,
      totalPages: page.totalPages,
    };
  }

  async get(id: string): Promise<AdminProduct> {
    this.assertId(id);
    const product = await this.repository.get(id);
    if (!product) throw new NotFoundException('Product not found.');
    return mapAdminProduct(product.id, product.data);
  }

  async categories(): Promise<string[]> {
    const snapshot = await this.repository.categories();
    const values = new Map<string, string>();
    for (const document of snapshot.docs) {
      const category: unknown = document.get('category');
      if (typeof category !== 'string' || !category.trim()) continue;
      const normalized = category.trim();
      values.set(normalized.toLowerCase(), normalized);
    }
    return [...values.values()].sort((left, right) =>
      left.localeCompare(right),
    );
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
    this.assertId(id);
    const values = productValues(input);
    await this.repository.db.runTransaction(async (transaction) => {
      const productReference = this.repository.productRef(id);
      const snapshot = await transaction.get(productReference);
      if (!snapshot.exists) throw new NotFoundException('Product not found.');
      const existing = mapAdminProduct(snapshot.id, snapshot.data()!);
      assertPublishable(input, existing.images.length);
      const skuChanged = existing.sku !== values.sku;
      if (skuChanged) {
        const [nextSkuLock, currentSkuLock] = await transaction.getAll(
          this.repository.skuRef(values.sku),
          this.repository.skuRef(existing.sku),
        );
        if (nextSkuLock.exists && nextSkuLock.get('productId') !== id) {
          throw new ConflictException('SKU already exists.');
        }
        if (currentSkuLock.exists && currentSkuLock.get('productId') !== id) {
          throw new ConflictException(
            'Stored SKU lock does not match product.',
          );
        }
        transaction.set(this.repository.skuRef(values.sku), { productId: id });
        if (currentSkuLock.exists) transaction.delete(currentSkuLock.ref);
      }
      transaction.update(productReference, {
        ...values,
        featuredRank:
          input.status === ProductStatus.ACTIVE
            ? (existing.featuredRank ?? Date.now())
            : existing.featuredRank,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(this.repository.auditRef(), {
        ...productAudit('product.updated', actor, id),
        inventoryChanged: existing.stockQuantity !== input.stockQuantity,
        previousStock: existing.stockQuantity,
        stockQuantity: input.stockQuantity,
      });
    });
    return this.get(id);
  }

  async archive(id: string, actor: AuthenticatedUser): Promise<void> {
    this.assertId(id);
    await this.repository.db.runTransaction(async (transaction) => {
      const productReference = this.repository.productRef(id);
      const product = await transaction.get(productReference);
      if (!product.exists) throw new NotFoundException('Product not found.');
      transaction.update(productReference, {
        status: ProductStatus.ARCHIVED,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(
        this.repository.auditRef(),
        productAudit('product.archived', actor, id),
      );
    });
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
