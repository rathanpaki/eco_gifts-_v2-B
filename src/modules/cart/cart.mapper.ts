import type { DocumentData } from 'firebase-admin/firestore';
import type {
  Cart,
  CartProductDocument,
  CartProductSnapshot,
  StoredCart,
  StoredCartItem,
} from './cart.types';
import {
  currencyCode,
  firstImage,
  image,
  integer,
  object,
  text,
  timestamp,
} from './cart-value.mapper';

export function mapStoredCart(data: DocumentData): StoredCart {
  const items = Array.isArray(data.items)
    ? data.items
        .map(storedItem)
        .filter((item): item is StoredCartItem => Boolean(item))
    : [];
  return {
    ownerId: text(data.ownerId),
    ownerType: data.ownerType === 'user' ? 'user' : 'guest',
    items: uniqueItems(items).slice(0, 50),
    updatedAt: timestamp(data.updatedAt),
  };
}

export function mapCart(
  stored: StoredCart | null,
  products: CartProductDocument[],
): Cart {
  if (!stored) return emptyCart();
  const current = new Map(
    products.map((product) => [product.id, product.data]),
  );
  const items = stored.items.map((item) => {
    const data = current.get(item.productId);
    const active = data?.status === 'active';
    const stockQuantity = active ? integer(data.stockQuantity) : 0;
    const priceCents = active ? integer(data.priceCents) : 0;
    const currency = active
      ? currencyCode(data.currency)
      : item.product.currency;
    const image = active
      ? (firstImage(data.images) ?? item.product.image)
      : item.product.image;
    return {
      itemId: item.itemId,
      productId: item.productId,
      slug: active ? text(data.slug) || item.product.slug : item.product.slug,
      name: active ? text(data.name) || item.product.name : item.product.name,
      image,
      priceCents,
      currency,
      quantity: item.quantity,
      lineTotalCents: priceCents * item.quantity,
      stockQuantity,
      available: active && stockQuantity > 0,
      exceedsStock: active && item.quantity > stockQuantity,
      personalizationAvailable:
        active && data.personalizationAvailable === true,
      ecoScore: active ? integer(data.ecoScore) : 0,
      customization: item.customization,
    };
  });
  const currencies = new Set(
    items.filter((item) => item.available).map((item) => item.currency),
  );
  return {
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
    currency: currencies.size === 1 ? [...currencies][0] : null,
    readyForCheckout:
      items.length > 0 &&
      currencies.size === 1 &&
      items.every((item) => item.available && !item.exceedsStock),
    updatedAt: stored.updatedAt || null,
  };
}

export function productSnapshot(data: DocumentData): CartProductSnapshot {
  return {
    name: text(data.name),
    slug: text(data.slug),
    currency: currencyCode(data.currency),
    image: firstImage(data.images),
  };
}

export function emptyCart(): Cart {
  return {
    items: [],
    totalQuantity: 0,
    subtotalCents: 0,
    currency: null,
    readyForCheckout: false,
    updatedAt: null,
  };
}

function storedItem(value: unknown): StoredCartItem | null {
  const data = object(value);
  const productId = text(data.productId);
  const quantity = integer(data.quantity);
  const product = object(data.product);
  if (!productId || quantity < 1 || quantity > 99) return null;
  return {
    itemId: text(data.itemId) || productId,
    productId,
    quantity,
    addedAt: text(data.addedAt),
    product: {
      name: text(product.name),
      slug: text(product.slug),
      currency: currencyCode(product.currency),
      image: image(product.image),
    },
    customization: customization(data.customization),
  };
}

function uniqueItems(items: StoredCartItem[]): StoredCartItem[] {
  return [...new Map(items.map((item) => [item.itemId, item])).values()];
}

function customization(value: unknown) {
  const data = object(value);
  const id = text(data.id);
  const previewPath = text(data.previewPath);
  return id &&
    /^\/api\/customizations\/[A-Za-z0-9_-]+\/preview$/.test(previewPath)
    ? { id, previewPath }
    : null;
}
