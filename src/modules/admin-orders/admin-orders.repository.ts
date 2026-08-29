import { Injectable, NotFoundException } from '@nestjs/common';
import { FieldPath, Timestamp, type Query } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { decodeOrderCursor, encodeOrderCursor } from '../orders/order.cursor';
import { mapOrderEvent } from '../orders/order-event.mapper';
import { orderEventValues } from '../orders/order-event.values';
import type { FulfillmentStatus } from '../orders/order.types';
import type { AdminOrderFilter } from './admin-order.filter';
import { filterStatus } from './admin-order.filter';
import type {
  AdminOrderDocument,
  AdminOrderMetrics,
} from './admin-order.types';
import {
  assertOrderTransition,
  itemQuantities,
} from './order-transition.policy';
import { restoreOrderInventory } from './order-inventory-restorer';
import { orderOwner, recordDeliveredOrder } from './order-customer-stats';
import { storedOrderStatus } from './stored-order-status';

@Injectable()
export class AdminOrdersRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async get(id: string): Promise<AdminOrderDocument | null> {
    const snapshot = await this.orderRef(id).get();
    return snapshot.exists
      ? { id: snapshot.id, data: snapshot.data() ?? {} }
      : null;
  }

  async events(orderId: string) {
    const snapshot = await this.orderRef(orderId)
      .collection('events')
      .orderBy('createdAt', 'asc')
      .get();
    return snapshot.docs.map((document) =>
      mapOrderEvent(document.id, document.data()),
    );
  }

  async list(filter: AdminOrderFilter, limit: number, cursor?: string) {
    let query: Query = this.orders();
    const status = filterStatus(filter);
    if (status) query = query.where('fulfillmentStatus', '==', status);
    query = query
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

  async metrics(): Promise<AdminOrderMetrics> {
    const statuses: FulfillmentStatus[] = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    const [total, ...counts] = await Promise.all([
      this.orders().count().get(),
      ...statuses.map((status) =>
        this.orders().where('fulfillmentStatus', '==', status).count().get(),
      ),
    ]);
    return {
      total: total.data().count,
      pending: counts[0].data().count,
      confirmed: counts[1].data().count,
      processing: counts[2].data().count,
      shipped: counts[3].data().count,
      delivered: counts[4].data().count,
      cancelled: counts[5].data().count,
    };
  }

  async transition(
    orderId: string,
    target: FulfillmentStatus,
    note: string | null,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const orderRef = this.orderRef(orderId);
    const eventRef = orderRef.collection('events').doc();
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const order = await transaction.get(orderRef);
      if (!order.exists) throw new NotFoundException('Order not found.');
      const data = order.data() ?? {};
      const current = storedOrderStatus(data.fulfillmentStatus);
      assertOrderTransition(current, target);
      const quantities =
        target === 'cancelled' ? itemQuantities(data.items) : null;
      const productRefs = quantities
        ? [...quantities.keys()].map((id) => this.productRef(id))
        : [];
      const products = productRefs.length
        ? await transaction.getAll(...productRefs)
        : [];
      const now = Timestamp.now();
      if (quantities) {
        restoreOrderInventory(transaction, products, quantities, {
          orderId,
          actorId: actor.uid,
          actorEmail: actor.email,
          createdAt: now,
        });
      }
      transaction.update(orderRef, {
        fulfillmentStatus: target,
        ...(target === 'delivered'
          ? {
              deliveredAt: now,
              deliveryConfirmationStatus: 'awaiting_customer',
              deliveryConfirmedAt: null,
            }
          : {}),
        ...(target === 'delivered' && data.paymentMethod === 'pay_on_delivery'
          ? { paymentStatus: 'paid' }
          : {}),
        updatedAt: now,
        updatedBy: actor.uid,
      });
      if (target === 'delivered') {
        recordDeliveredOrder(
          transaction,
          this.userRef(orderOwner(data)),
          data,
          now,
        );
      }
      transaction.create(
        eventRef,
        orderEventValues(
          {
            fromStatus: current,
            toStatus: target,
            note,
            actorId: actor.uid,
            actorEmail: actor.email,
            actorType: 'admin',
          },
          now,
        ),
      );
    });
  }

  private orders() {
    return this.firebase.firestore.collection('orders');
  }
  private orderRef(id: string) {
    return this.orders().doc(id);
  }
  private productRef(id: string) {
    return this.firebase.firestore.collection('products').doc(id);
  }
  private userRef(id: string) {
    return this.firebase.firestore.collection('users').doc(id);
  }
}
