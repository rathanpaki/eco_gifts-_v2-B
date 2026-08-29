import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertPublishable,
  productSlug,
} from '../modules/admin-products/admin-product.utils';
import { seedCatalogA } from './product-seed.catalog-a';
import { seedCatalogB } from './product-seed.catalog-b';
import { seedCatalogC } from './product-seed.catalog-c';
import { productWriteInput } from './product-seed.types';

export const testProductCatalog = [
  ...seedCatalogA,
  ...seedCatalogB,
  ...seedCatalogC,
];

export function seedAssetRoot(): string {
  return resolve(
    process.env.PRODUCT_SEED_ASSET_ROOT ??
      resolve(process.cwd(), '..', 'eco_gifts_v2', 'public', 'images'),
  );
}

export function validateSeedCatalog(assetRoot: string): void {
  if (testProductCatalog.length !== 30) {
    throw new Error(
      `Expected 30 seed products, found ${testProductCatalog.length}.`,
    );
  }
  unique(
    testProductCatalog.map((item) => item.id),
    'product ids',
  );
  unique(
    testProductCatalog.map((item) => item.sku),
    'SKUs',
  );
  unique(
    testProductCatalog.map((item) => productSlug(item.name)),
    'slugs',
  );
  for (const product of testProductCatalog) {
    if (!/^[a-z0-9-]{3,128}$/.test(product.id)) {
      throw new Error(`Invalid seed id: ${product.id}.`);
    }
    assertPublishable(productWriteInput(product), 1);
    const imagePath = resolve(assetRoot, product.imageFile);
    if (!existsSync(imagePath)) {
      throw new Error(`Missing seed image: ${imagePath}.`);
    }
  }
}

export function seedCatalogSummary(): string {
  const categories = new Set(testProductCatalog.map((item) => item.category));
  const personalizable = testProductCatalog.filter(
    (item) => item.personalizationAvailable,
  ).length;
  const lowStock = testProductCatalog.filter(
    (item) => item.stockQuantity <= item.lowStockThreshold,
  ).length;
  return `${testProductCatalog.length} products, ${categories.size} categories, ${personalizable} personalizable, ${lowStock} low-stock`;
}

function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`Seed catalog contains duplicate ${label}.`);
  }
}
