import { Injectable } from '@nestjs/common';
import { FieldPath, Timestamp, type Query } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { Role } from '../../auth/role.enum';
import { mapOrderSummary } from '../orders/order-summary.mapper';
import type { CustomerListQueryDto } from './dto/customer-list-query.dto';
import { decodeCustomerCursor, encodeCustomerCursor } from './customer.cursor';

@Injectable()
export class AdminCustomersRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async list(query: CustomerListQueryDto, customerId?: string) {
    if (customerId) {
      const customer = await this.profile(customerId);
      return { docs: customer ? [customer] : [], nextCursor: null };
    }
    let customers: Query = this.users().where('role', '==', Role.USER);
    if (query.consent !== 'any') {
      customers = customers.where(
        'marketingOptIn',
        '==',
        query.consent === 'opted-in',
      );
    }
    if (query.orders !== 'any') {
      customers = customers.where('customerSegment', '==', query.orders);
    }
    const search = normalizedSearch(query.search);
    if (search)
      customers = customers.where('searchTerms', 'array-contains', search);
    customers = customers
      .orderBy('createdAt', 'desc')
      .orderBy(FieldPath.documentId(), 'desc');
    if (query.cursor) {
      customers = customers.startAfter(...decodeCustomerCursor(query.cursor));
    }
    const snapshot = await customers.limit(query.limit + 1).get();
    const hasMore = snapshot.docs.length > query.limit;
    const docs = snapshot.docs.slice(0, query.limit);
    const last = docs.at(-1);
    return {
      docs: docs.map((document) => ({
        id: document.id,
        data: document.data(),
      })),
      nextCursor:
        hasMore && last ? encodeCustomerCursor(last.id, last.data()) : null,
    };
  }

  async profile(id: string) {
    const snapshot = await this.users().doc(id).get();
    return snapshot.exists && snapshot.get('role') === Role.USER
      ? { id: snapshot.id, data: snapshot.data() ?? {} }
      : null;
  }

  async authUser(id: string) {
    return this.firebase.auth.getUser(id);
  }

  async orderOwner(orderNumber: string): Promise<string | null> {
    const snapshot = await this.firebase.firestore
      .collection('orders')
      .where('orderNumber', '==', orderNumber.toUpperCase())
      .limit(1)
      .get();
    const owner: unknown = snapshot.docs[0]?.get('userId');
    return typeof owner === 'string' && owner ? owner : null;
  }

  async orders(customerId: string, limit?: number) {
    let query = this.firebase.firestore
      .collection('orders')
      .where('userId', '==', customerId)
      .orderBy('createdAt', 'desc');
    if (limit) query = query.limit(limit);
    const snapshot = await query.get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      data: document.data(),
      summary: mapOrderSummary(document.id, document.data()),
    }));
  }

  async notes(customerId: string) {
    const snapshot = await this.users()
      .doc(customerId)
      .collection('notes')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      data: document.data(),
    }));
  }

  async addNote(customerId: string, body: string, actor: AuthenticatedUser) {
    const reference = this.users().doc(customerId).collection('notes').doc();
    await reference.create({
      body,
      actorId: actor.uid,
      actorEmail: actor.email,
      createdAt: Timestamp.now(),
    });
    return reference.get();
  }

  get db() {
    return this.firebase.firestore;
  }

  private users() {
    return this.firebase.firestore.collection('users');
  }
}

function normalizedSearch(value?: string): string | null {
  return value?.trim().toLowerCase() || null;
}
