import { Injectable } from '@nestjs/common';
import {
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
    const snapshot = await this.range('orders', start, end).get();
    const paid = snapshot.docs.filter(
      (document) => document.get('paymentStatus') === 'paid',
    );
    return {
      orderCount: snapshot.size,
      paidOrderCount: paid.length,
      revenueCents: paid.reduce(
        (total, document) => total + cents(document.get('totalCents')),
        0,
      ),
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
    const snapshot = await this.range('orders', start, end).get();
    return snapshot.docs
      .filter((document) => document.get('paymentStatus') === 'paid')
      .map((document) => document.data());
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
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}
