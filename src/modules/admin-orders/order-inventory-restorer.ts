import { InternalServerErrorException } from '@nestjs/common';
import {
  Timestamp,
  type DocumentSnapshot,
  type Transaction,
} from 'firebase-admin/firestore';

export function restoreOrderInventory(
  transaction: Transaction,
  products: DocumentSnapshot[],
  quantities: Map<string, number>,
  context?: {
    orderId: string;
    actorId: string;
    actorEmail: string | null;
    createdAt: Timestamp;
  },
): void {
  products.forEach((product) => {
    const data = product.data();
    if (!data) throw invalidInventory();
    const stock: unknown = data.stockQuantity;
    const threshold: unknown = data.lowStockThreshold;
    if (
      !Number.isSafeInteger(stock) ||
      (stock as number) < 0 ||
      !Number.isSafeInteger(threshold) ||
      (threshold as number) < 0
    )
      throw invalidInventory();
    const restored = (stock as number) + (quantities.get(product.id) ?? 0);
    if (!Number.isSafeInteger(restored)) throw invalidInventory();
    const updatedAt = context?.createdAt ?? Timestamp.now();
    transaction.update(product.ref, {
      stockQuantity: restored,
      lowStock: restored <= (threshold as number),
      updatedAt,
    });
    if (context) {
      const eventRef = product.ref.firestore
        .collection('inventoryEvents')
        .doc(`reversal_${context.orderId}_${product.id}`);
      transaction.create(eventRef, {
        id: eventRef.id,
        productId: product.id,
        productName: productName(data.name, product.id),
        orderId: context.orderId,
        type: 'sale_reversal',
        quantityDelta: quantities.get(product.id) ?? 0,
        stockBefore: stock,
        stockAfter: restored,
        reason: 'Order cancelled',
        actorId: context.actorId,
        actorEmail: context.actorEmail,
        createdAt: updatedAt,
      });
    }
  });
}

function productName(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function invalidInventory(): InternalServerErrorException {
  return new InternalServerErrorException('Stored inventory data is invalid.');
}
