import { Injectable } from '@nestjs/common';
import { FieldPath, type Query } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { decodeOrderCursor, encodeOrderCursor } from './order.cursor';
import type { OrderDocumentPage } from './order.types';

@Injectable()
export class OrdersRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async get(id: string) {
    const snapshot = await this.orders().doc(id).get();
    return snapshot.exists
      ? { id: snapshot.id, data: snapshot.data() ?? {} }
      : null;
  }

  async events(orderId: string) {
    const snapshot = await this.orders()
      .doc(orderId)
      .collection('events')
      .orderBy('createdAt', 'asc')
      .get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      data: document.data(),
    }));
  }

  async list(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<OrderDocumentPage> {
    let query: Query = this.orders()
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .orderBy(FieldPath.documentId(), 'desc');
    if (cursor) query = query.startAfter(...decodeOrderCursor(cursor));
    const snapshot = await query.limit(limit + 1).get();
    const hasMore = snapshot.docs.length > limit;
    const docs = snapshot.docs.slice(0, limit);
    const last = docs.at(-1);
    return {
      docs: docs.map((document) => ({
        id: document.id,
        data: document.data(),
      })),
      nextCursor:
        hasMore && last ? encodeOrderCursor(last.id, last.data()) : null,
    };
  }

  private orders() {
    return this.firebase.firestore.collection('orders');
  }
}
