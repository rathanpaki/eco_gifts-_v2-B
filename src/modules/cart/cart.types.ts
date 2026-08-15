import type { DocumentData } from 'firebase-admin/firestore';

export type CartOwnerType = 'guest' | 'user';

export interface CartIdentity {
  cartId: string;
  ownerId: string;
  ownerType: CartOwnerType;
  guestCartId?: string;
}

export interface CartProductSnapshot {
  name: string;
  slug: string;
  currency: string;
  image: CartImage | null;
}

export interface StoredCartItem {
  itemId: string;
  productId: string;
  quantity: number;
  addedAt: string;
  product: CartProductSnapshot;
  customization: CartCustomization | null;
}

export interface StoredCart {
  ownerId: string;
  ownerType: CartOwnerType;
  items: StoredCartItem[];
  updatedAt: string;
}

export interface CartImage {
  url: string;
  alt: string;
}

export interface CartItem {
  itemId: string;
  productId: string;
  slug: string;
  name: string;
  image: CartImage | null;
  priceCents: number;
  currency: string;
  quantity: number;
  lineTotalCents: number;
  stockQuantity: number;
  available: boolean;
  exceedsStock: boolean;
  personalizationAvailable: boolean;
  ecoScore: number;
  customization: CartCustomization | null;
}

export interface CartCustomization {
  id: string;
  previewPath: string;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  subtotalCents: number;
  currency: string | null;
  readyForCheckout: boolean;
  updatedAt: string | null;
}

export interface CartProductDocument {
  id: string;
  data: DocumentData;
}
