import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase-admin/firestore';
import { mapStoredCart } from './cart.mapper';
import type {
  CartCustomization,
  CartIdentity,
  StoredCart,
  StoredCartItem,
} from './cart.types';

export function readOwnedCart(
  snapshot: DocumentSnapshot,
  identity: CartIdentity,
): StoredCart {
  if (!snapshot.exists) {
    return {
      ownerId: identity.ownerId,
      ownerType: identity.ownerType,
      items: [],
      updatedAt: '',
    };
  }
  const cart = mapStoredCart(snapshot.data() ?? {});
  if (
    cart.ownerId !== identity.ownerId ||
    cart.ownerType !== identity.ownerType
  ) {
    throw new ConflictException('The cart owner does not match.');
  }
  return cart;
}

export function writeCartData(
  identity: CartIdentity,
  items: StoredCartItem[],
  created: boolean,
  ttlMilliseconds: number,
): DocumentData {
  return {
    ownerId: identity.ownerId,
    ownerType: identity.ownerType,
    items,
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + ttlMilliseconds),
    ...(created ? { createdAt: FieldValue.serverTimestamp() } : {}),
  };
}

export function validatedProduct(
  snapshot: DocumentSnapshot,
  quantity: number,
): DocumentData {
  const data = snapshot.data();
  if (!snapshot.exists || !data || data.status !== 'active') {
    throw new NotFoundException('This product is not available.');
  }
  const stock = Number.isSafeInteger(data.stockQuantity)
    ? Number(data.stockQuantity)
    : 0;
  if (stock < quantity) {
    throw new BadRequestException(
      `Only ${stock} item${stock === 1 ? '' : 's'} are available.`,
    );
  }
  return data;
}

export function mergeCartItems(
  user: StoredCartItem[],
  guest: StoredCart,
): StoredCartItem[] {
  if (guest.ownerType !== 'guest') {
    throw new ConflictException('The guest cart is invalid.');
  }
  const items = new Map(user.map((item) => [item.itemId, item]));
  guest.items.forEach((item) => {
    const current = items.get(item.itemId);
    items.set(
      item.itemId,
      current
        ? {
            ...current,
            quantity: Math.min(99, current.quantity + item.quantity),
          }
        : item,
    );
  });
  return [...items.values()].slice(0, 50);
}

export function productQuantity(
  items: StoredCartItem[],
  productId: string,
  itemId: string,
  nextQuantity: number,
): number {
  const hasTarget = items.some((item) => item.itemId === itemId);
  const total = items.reduce(
    (total, item) =>
      total +
      (item.productId === productId
        ? item.itemId === itemId
          ? nextQuantity
          : item.quantity
        : 0),
    0,
  );
  return hasTarget ? total : total + nextQuantity;
}

export function validatedCustomization(
  snapshot: DocumentSnapshot | undefined,
  identity: CartIdentity,
  productId: string,
  customizationId: string | undefined,
): CartCustomization | null {
  if (!customizationId) return null;
  const data = snapshot?.data();
  if (
    identity.ownerType !== 'user' ||
    !snapshot?.exists ||
    !data ||
    data.userId !== identity.ownerId ||
    data.productId !== productId ||
    data.status !== 'active' ||
    typeof data.previewPath !== 'string'
  ) {
    throw new BadRequestException('The customization is not available.');
  }
  return { id: customizationId, previewPath: data.previewPath };
}

export function isCartExpired(data: DocumentData | undefined): boolean {
  return (
    data?.expiresAt instanceof Timestamp &&
    data.expiresAt.toMillis() <= Date.now()
  );
}
