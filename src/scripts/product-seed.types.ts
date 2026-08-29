import type { ProductWriteInput } from '../modules/admin-products/admin-product.types';
import { ProductStatus } from '../modules/admin-products/product-status.enum';

export interface SeedProductDefinition extends ProductWriteInput {
  id: string;
  imageFile: string;
  imageAlt: string;
  featuredRank: number | null;
}

type DefaultedKey =
  | 'currency'
  | 'lowStockThreshold'
  | 'materialsVerified'
  | 'packagingVerified'
  | 'contributionVerified'
  | 'status'
  | 'featuredRank';

type SeedProductInput = Omit<SeedProductDefinition, DefaultedKey> &
  Partial<Pick<SeedProductDefinition, DefaultedKey>>;

export function seedProduct(input: SeedProductInput): SeedProductDefinition {
  return {
    currency: 'USD',
    lowStockThreshold: 8,
    materialsVerified: true,
    packagingVerified: true,
    contributionVerified: true,
    status: ProductStatus.ACTIVE,
    featuredRank: null,
    ...input,
  };
}

export function productWriteInput(
  product: SeedProductDefinition,
): ProductWriteInput {
  const { id, imageFile, imageAlt, featuredRank, ...input } = product;
  void id;
  void imageFile;
  void imageAlt;
  void featuredRank;
  return input;
}
