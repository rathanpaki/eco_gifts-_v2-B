import {
  type DocumentSnapshot,
  type Transaction,
  type Timestamp,
} from 'firebase-admin/firestore';
import type { CartItem } from '../cart/cart.types';

export function reserveCheckoutStock(
  transaction: Transaction,
  snapshots: DocumentSnapshot[],
  items: CartItem[],
  updatedAt: Timestamp,
  orderId: string,
  actorId: string,
): void {
  snapshots.forEach((snapshot) => {
    const orderedQuantity = items
      .filter((entry) => entry.productId === snapshot.id)
      .reduce((total, item) => total + item.quantity, 0);
    if (!orderedQuantity) return;
    const data = snapshot.data() ?? {};
    const stockBefore = Number(data.stockQuantity);
    const remaining = stockBefore - orderedQuantity;
    const threshold = Number.isSafeInteger(data.lowStockThreshold)
      ? Number(data.lowStockThreshold)
      : 0;
    transaction.update(snapshot.ref, {
      stockQuantity: remaining,
      lowStock: remaining <= threshold,
      updatedAt,
    });
    const eventRef = snapshot.ref.firestore
      .collection('inventoryEvents')
      .doc(`sale_${orderId}_${snapshot.id}`);
    transaction.create(eventRef, {
      id: eventRef.id,
      productId: snapshot.id,
      productName:
        typeof data.name === 'string' && data.name.trim()
          ? data.name.trim()
          : snapshot.id,
      orderId,
      type: 'sale',
      quantityDelta: -orderedQuantity,
      stockBefore,
      stockAfter: remaining,
      reason: 'Order placed',
      actorId,
      actorEmail: null,
      createdAt: updatedAt,
    });
  });
}
