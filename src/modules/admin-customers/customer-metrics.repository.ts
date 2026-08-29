import { Injectable } from '@nestjs/common';
import { AggregateField, Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { Role } from '../../auth/role.enum';
import { customerMetrics, customerMetricWindow } from './customer-metrics';

@Injectable()
export class CustomerMetricsRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async get(now = new Date()) {
    const allUsers = this.firebase.firestore.collection('users');
    const users = allUsers.where('role', '==', Role.USER);
    const window = customerMetricWindow(now);
    const [
      total,
      current,
      previous,
      buyers,
      repeat,
      consent,
      lifetime,
      completed,
    ] = await Promise.all([
      users.count().get(),
      users
        .where('createdAt', '>=', Timestamp.fromDate(window.currentStart))
        .orderBy('createdAt', 'desc')
        .count()
        .get(),
      users
        .where('createdAt', '>=', Timestamp.fromDate(window.previousStart))
        .where('createdAt', '<', Timestamp.fromDate(window.currentStart))
        .orderBy('createdAt', 'desc')
        .count()
        .get(),
      users.where('hasOrders', '==', true).count().get(),
      users.where('repeatCustomer', '==', true).count().get(),
      users.where('marketingOptIn', '==', true).count().get(),
      allUsers
        .aggregate({ value: AggregateField.sum('lifetimeValueCents') })
        .get(),
      allUsers
        .aggregate({ value: AggregateField.sum('completedOrderCount') })
        .get(),
    ]);

    return customerMetrics({
      total: total.data().count,
      currentMonth: current.data().count,
      previousMonth: previous.data().count,
      buyers: buyers.data().count,
      repeatBuyers: repeat.data().count,
      optedIn: consent.data().count,
      lifetimeValueCents: safeAggregate(lifetime.data().value),
      completedOrders: safeAggregate(completed.data().value),
    });
  }
}

function safeAggregate(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}
