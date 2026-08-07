import type { ProductStatus } from './product-status.enum';

export interface ProductImage {
  id: string;
  url: string;
  storagePath: string;
  alt: string;
}

export interface EcoEvidence {
  materialsVerified: boolean;
  packagingVerified: boolean;
  contributionVerified: boolean;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  sku: string;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  lowStock: boolean;
  personalizationAvailable: boolean;
  ecoScore: number;
  ecoEvidence: EcoEvidence;
  ecoEvidenceComplete: boolean;
  images: ProductImage[];
  status: ProductStatus;
  featuredRank: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMetrics {
  active: number;
  lowStock: number;
  drafts: number;
  missingEcoEvidence: number;
}

export interface AdminProductPage {
  items: AdminProduct[];
  metrics: ProductMetrics;
  nextCursor: string | null;
}

export interface ProductWriteInput {
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  sku: string;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  personalizationAvailable: boolean;
  ecoScore: number;
  materialsVerified: boolean;
  packagingVerified: boolean;
  contributionVerified: boolean;
  status: ProductStatus;
}
