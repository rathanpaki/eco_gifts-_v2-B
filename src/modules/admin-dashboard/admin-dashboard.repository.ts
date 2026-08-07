import { Injectable } from '@nestjs/common';
import {
  AggregateField,
  Timestamp,
  type DocumentData,
  type Query,
} from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { PeriodSummary } from './admin-dashboard.types';

@Injectable()
export class AdminDashboardRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async period(start: Date, end: Date): Promise<PeriodSummary> {
    const orders = this.range('orders', start, end);
    const paid = orders.where('paymentStatus', '==', 'paid');
    const [countResult, paidResult] = await Promise.all([
      orders.count().get(),
      paid
        .aggregate({
          count: AggregateField.count(),
          revenueCents: AggregateField.sum('totalCents'),
        })
        .get(),
    ]);
    const paidData = paidResult.data();
    return {
      orderCount: count(countResult.data().count),
      paidOrderCount: count(paidData.count),
      revenueCents: cents(paidData.revenueCents),
    };
  }

  async count(
    collection: string,
    field: string,
    value: unknown,
  ): Promise<number> {
    const result = await this.firebase.firestore
      .collection(collection)
      .where(field, '==', value)
      .count()
      .get();
    return count(result.data().count);
  }

  async weeklyPaidOrders(start: Date, end: Date): Promise<DocumentData[]> {
    const snapshot = await this.firebase.firestore
      .collection('orders')
      .where('paymentStatus', '==', 'paid')
      .where('createdAt', '>=', Timestamp.fromDate(start))
      .where('createdAt', '<', Timestamp.fromDate(end))
      .get();
    return snapshot.docs.map((document) => document.data());
  }

  async recentOrders(limit: number) {
    const snapshot = await this.firebase.firestore
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      data: document.data(),
    }));
  }

  private range(collection: string, start: Date, end: Date): Query {
    return this.firebase.firestore
      .collection(collection)
      .where('createdAt', '>=', Timestamp.fromDate(start))
      .where('createdAt', '<', Timestamp.fromDate(end));
  }
}

function count(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error('Firestore returned an invalid aggregate count.');
  }
  return value as number;
}

function cents(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error('Firestore returned an invalid revenue total.');
  }
  return value as number;
}
