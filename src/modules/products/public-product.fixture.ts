import { Timestamp, type DocumentData } from 'firebase-admin/firestore';

export function publicProductFixture(
  overrides: DocumentData = {},
): DocumentData {
  return {
    slug: 'artisan-candle',
    name: 'Artisan Candle',
    shortDescription: 'A clean-burning soy candle.',
    description: 'Hand-poured using responsibly sourced soy wax.',
    category: 'Home',
    occasions: ['wedding', 'birthday'],
    priceCents: 3400,
    currency: 'USD',
    stockQuantity: 6,
    lowStockThreshold: 4,
    personalizationAvailable: true,
    ecoScore: 94,
    ecoEvidence: {
      materialsVerified: true,
      packagingVerified: true,
      contributionVerified: true,
    },
    images: [
      {
        id: 'image-1',
        url: 'https://storage.googleapis.com/products/candle.webp',
        storagePath: 'products/private/path.webp',
        alt: 'Artisan candle in a glass jar',
      },
    ],
    featuredRank: 10,
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
    updatedAt: Timestamp.fromMillis(1_700_000_100_000),
    ...overrides,
  };
}
