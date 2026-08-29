import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type {
  AdminProduct,
  EcoEvidence,
  ProductImage,
} from './admin-product.types';
import { ProductStatus } from './product-status.enum';
import { productOccasionList } from '../products/product-occasion';

export function mapAdminProduct(id: string, data: DocumentData): AdminProduct {
  const product: AdminProduct = {
    id,
    slug: text(data.slug),
    name: text(data.name),
    shortDescription: text(data.shortDescription),
    description: text(data.description),
    category: text(data.category),
    occasions: productOccasionList(data.occasions),
    sku: text(data.sku),
    priceCents: integer(data.priceCents),
    currency: text(data.currency),
    stockQuantity: integer(data.stockQuantity),
    lowStockThreshold: integer(data.lowStockThreshold),
    lowStock: data.lowStock === true,
    personalizationAvailable: data.personalizationAvailable === true,
    ecoScore: integer(data.ecoScore),
    ecoEvidence: evidence(data.ecoEvidence),
    ecoEvidenceComplete: data.ecoEvidenceComplete === true,
    images: images(data.images, data.image),
    status: status(data.status),
    featuredRank: nullableInteger(data.featuredRank),
    createdAt: date(data.createdAt),
    updatedAt: date(data.updatedAt),
  };
  if (!product.slug || !product.name || !product.currency || !product.sku) {
    throw new InternalServerErrorException(`Product ${id} has invalid data.`);
  }
  return product;
}

function images(value: unknown, legacy: unknown): ProductImage[] {
  const source = Array.isArray(value) ? value : legacy ? [legacy] : [];
  return source
    .map((entry, index) => {
      const item = object(entry);
      return {
        id: text(item.id) || `legacy-${index}`,
        url: text(item.url),
        storagePath: text(item.storagePath),
        alt: text(item.alt),
      };
    })
    .filter((image) => image.url && image.alt);
}

function evidence(value: unknown): EcoEvidence {
  const item = object(value);
  return {
    materialsVerified: item.materialsVerified === true,
    packagingVerified: item.packagingVerified === true,
    contributionVerified: item.contributionVerified === true,
  };
}

function object(value: unknown): DocumentData {
  return typeof value === 'object' && value !== null ? value : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function integer(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}

function nullableInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : null;
}

function status(value: unknown): ProductStatus {
  if (Object.values(ProductStatus).includes(value as ProductStatus))
    return value as ProductStatus;
  throw new InternalServerErrorException('Product status is invalid.');
}

function date(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  throw new InternalServerErrorException('Product timestamp is invalid.');
}
