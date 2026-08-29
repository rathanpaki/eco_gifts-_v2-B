import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type {
  PublicEcoEvidence,
  PublicProduct,
  PublicProductImage,
} from './product.types';
import { productOccasionList } from './product-occasion';

export function mapPublicProduct(
  id: string,
  data: DocumentData,
): PublicProduct {
  const stockQuantity = integer(data.stockQuantity, 'stock quantity');
  const lowStockThreshold = integer(
    data.lowStockThreshold,
    'low stock threshold',
  );
  const product: PublicProduct = {
    id,
    slug: requiredText(data.slug, 'slug'),
    name: requiredText(data.name, 'name'),
    shortDescription: requiredText(data.shortDescription, 'short description'),
    description: requiredText(data.description, 'description'),
    category: requiredText(data.category, 'category'),
    occasions: productOccasionList(data.occasions),
    priceCents: integer(data.priceCents, 'price'),
    currency: requiredText(data.currency, 'currency'),
    stockQuantity,
    inStock: stockQuantity > 0,
    lowStock: stockQuantity <= lowStockThreshold,
    personalizationAvailable: data.personalizationAvailable === true,
    ecoScore: integer(data.ecoScore, 'eco score', 100),
    ecoEvidence: evidence(data.ecoEvidence),
    images: images(data.images, data.image),
    featuredRank: nullableInteger(data.featuredRank),
    createdAt: date(data.createdAt, 'createdAt'),
    updatedAt: date(data.updatedAt, 'updatedAt'),
  };
  if (!/^[A-Z]{3}$/.test(product.currency)) invalid(id, 'currency');
  return product;
}

function images(value: unknown, legacy: unknown): PublicProductImage[] {
  const source = Array.isArray(value) ? value : legacy ? [legacy] : [];
  return source.flatMap((entry, index) => {
    const image = object(entry);
    const url = text(image.url);
    const alt = text(image.alt);
    if (!url || !alt) return [];
    return [{ id: text(image.id) || `legacy-${index}`, url, alt }];
  });
}

function evidence(value: unknown): PublicEcoEvidence {
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
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value: unknown, field: string): string {
  const result = text(value);
  if (!result) throw new InternalServerErrorException(`Invalid ${field}.`);
  return result;
}

function integer(value: unknown, field: string, max = Number.MAX_SAFE_INTEGER) {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < 0 ||
    (value as number) > max
  ) {
    throw new InternalServerErrorException(`Invalid ${field}.`);
  }
  return value as number;
}

function nullableInteger(value: unknown): number | null {
  return value === null ? null : integer(value, 'featured rank');
}

function date(value: unknown, field: string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  throw new InternalServerErrorException(`Invalid ${field}.`);
}

function invalid(id: string, field: string): never {
  throw new InternalServerErrorException(
    `Published product ${id} has invalid ${field}.`,
  );
}
