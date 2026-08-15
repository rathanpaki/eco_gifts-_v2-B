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
): void {
  products.forEach((product) => {
    const data = product.data();
    if (!data) throw invalidInventory();
    const stock = data.stockQuantity;
    const threshold = data.lowStockThreshold;
    if (
      !Number.isSafeInteger(stock) ||
      (stock as number) < 0 ||
      !Number.isSafeInteger(threshold) ||
      (threshold as number) < 0
    )
      throw invalidInventory();
    const restored = (stock as number) + (quantities.get(product.id) ?? 0);
    if (!Number.isSafeInteger(restored)) throw invalidInventory();
    transaction.update(product.ref, {
      stockQuantity: restored,
      lowStock: restored <= (threshold as number),
      updatedAt: Timestamp.now(),
    });
  });
}

function invalidInventory(): InternalServerErrorException {
  return new InternalServerErrorException('Stored inventory data is invalid.');
}
