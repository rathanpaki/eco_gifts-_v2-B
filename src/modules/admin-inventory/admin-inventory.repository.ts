import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type {
  InventoryAdjustmentInput,
  InventoryEvent,
} from './admin-inventory.types';
import { mapInventoryEvent } from './inventory-event.mapper';

@Injectable()
export class AdminInventoryRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async adjust(
    productId: string,
    input: InventoryAdjustmentInput,
    actor: AuthenticatedUser,
  ): Promise<InventoryEvent> {
    const productRef = this.products().doc(productId);
    const eventRef = this.events().doc();
    let result: InventoryEvent | null = null;
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const product = await transaction.get(productRef);
      if (!product.exists) throw new NotFoundException('Product not found.');
      const data = product.data() ?? {};
      const before = storedStock(data.stockQuantity);
      const after = before + input.quantityDelta;
      if (!Number.isSafeInteger(after) || after < 0) {
        throw new BadRequestException(
          'The adjustment cannot make stock negative.',
        );
      }
      const threshold = nonnegative(data.lowStockThreshold);
      const createdAt = Timestamp.now();
      const document = {
        id: eventRef.id,
        productId,
        productName:
          typeof data.name === 'string' && data.name.trim()
            ? data.name.trim()
            : productId,
        orderId: null,
        type: input.kind,
        quantityDelta: input.quantityDelta,
        stockBefore: before,
        stockAfter: after,
        reason: input.reason.trim(),
        actorId: actor.uid,
        actorEmail: actor.email,
        createdAt,
      };
      transaction.update(productRef, {
        stockQuantity: after,
        lowStock: after <= threshold,
        ...(input.kind === 'restock' && input.quantityDelta > 0
          ? { lastRestockedAt: createdAt }
          : {}),
        updatedAt: createdAt,
        updatedBy: actor.uid,
      });
      transaction.create(eventRef, document);
      result = mapInventoryEvent(document);
    });
    if (!result) throw new Error('Inventory adjustment did not complete.');
    return result;
  }

  async history(productId: string, limit: number): Promise<InventoryEvent[]> {
    const product = await this.products().doc(productId).get();
    if (!product.exists) throw new NotFoundException('Product not found.');
    const snapshot = await this.events()
      .where('productId', '==', productId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map((document) => mapInventoryEvent(document.data()));
  }

  private products() {
    return this.firebase.firestore.collection('products');
  }
  private events() {
    return this.firebase.firestore.collection('inventoryEvents');
  }
}

function storedStock(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new BadRequestException('Stored product stock is invalid.');
  }
  return value as number;
}
function nonnegative(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}
