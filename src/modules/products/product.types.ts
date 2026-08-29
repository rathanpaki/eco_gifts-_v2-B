import type { DocumentData } from 'firebase-admin/firestore';
import type { ProductOccasion } from './product-occasion';

export type PublicProductSort =
  'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export interface PublicProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface PublicEcoEvidence {
  materialsVerified: boolean;
  packagingVerified: boolean;
  contributionVerified: boolean;
}

export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  occasions: ProductOccasion[];
  priceCents: number;
  currency: string;
  stockQuantity: number;
  inStock: boolean;
  lowStock: boolean;
  personalizationAvailable: boolean;
  ecoScore: number;
  ecoEvidence: PublicEcoEvidence;
  images: PublicProductImage[];
  featuredRank: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProductPage {
  items: PublicProduct[];
  nextCursor: string | null;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PublicProductDocument {
  id: string;
  data: DocumentData;
}

export interface PublicProductDocumentPage {
  docs: PublicProductDocument[];
  nextCursor: string | null;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PublicProductListInput {
  searchTokens: string[];
  category?: string;
  occasion?: ProductOccasion;
  minPriceCents?: number;
  maxPriceCents?: number;
  personalizable?: boolean;
  sort: PublicProductSort;
  cursor?: string;
  page: number;
  limit: number;
}
