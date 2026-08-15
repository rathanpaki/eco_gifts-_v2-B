import { Injectable } from '@nestjs/common';
import { AggregateField, Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { Role } from '../../auth/role.enum';
import { customerMetrics, customerMetricWindow } from './customer-metrics';

@Injectable()
export class CustomerMetricsRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async get(now = new Date()) {
    const users = this.firebase.firestore
      .collection('users')
      .where('role', '==', Role.USER);
    const window = customerMetricWindow(now);
    const [total, current, previous, buyers, repeat, consent, values] =
      await Promise.all([
        users.count().get(),
        users
          .where('createdAt', '>=', Timestamp.fromDate(window.currentStart))
          .count()
          .get(),
        users
          .where('createdAt', '>=', Timestamp.fromDate(window.previousStart))
          .where('createdAt', '<', Timestamp.fromDate(window.currentStart))
          .count()
          .get(),
        users.where('hasOrders', '==', true).count().get(),
        users.where('repeatCustomer', '==', true).count().get(),
        users.where('marketingOptIn', '==', true).count().get(),
        users
          .aggregate({
            lifetimeValueCents: AggregateField.sum('lifetimeValueCents'),
            completedOrders: AggregateField.sum('completedOrderCount'),
          })
          .get(),
      ]);
    const aggregate = values.data();
    return customerMetrics({
      total: total.data().count,
      currentMonth: current.data().count,
      previousMonth: previous.data().count,
      buyers: buyers.data().count,
      repeatBuyers: repeat.data().count,
      optedIn: consent.data().count,
      lifetimeValueCents: safeAggregate(aggregate.lifetimeValueCents),
      completedOrders: safeAggregate(aggregate.completedOrders),
    });
  }
}

function safeAggregate(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}
