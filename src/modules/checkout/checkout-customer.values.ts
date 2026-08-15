import {
  Timestamp,
  type DocumentReference,
  type DocumentSnapshot,
  type Transaction,
} from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import {
  customerSearchTerms,
  customerSegment,
  storedCount,
} from '../../auth/user-profile.values';

export function recordCustomerOrder(
  transaction: Transaction,
  reference: DocumentReference,
  snapshot: DocumentSnapshot,
  user: AuthenticatedUser,
  createdAt: Timestamp,
): void {
  const orderCount = storedCount(snapshot.get('orderCount')) + 1;
  transaction.set(
    reference,
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: 'USER',
      emailVerified: user.emailVerified,
      searchTerms: customerSearchTerms(user.displayName, user.email),
      orderCount,
      hasOrders: true,
      repeatCustomer: orderCount >= 2,
      customerSegment: customerSegment(orderCount),
      lastOrderAt: createdAt,
      updatedAt: createdAt,
      ...(snapshot.exists ? {} : customerDefaults(createdAt)),
    },
    { merge: true },
  );
}

function customerDefaults(createdAt: Timestamp) {
  return {
    createdAt,
    completedOrderCount: 0,
    lifetimeValueCents: 0,
    impactPlasticAvoidedGrams: 0,
    impactCo2SavedKg: 0,
    rewardPoints: 0,
    marketingOptIn: false,
  };
}
