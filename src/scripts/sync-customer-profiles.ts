import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { AppModule } from '../app.module';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { Role, roleFromClaims } from '../auth/role.enum';
import {
  customerSearchTerms,
  customerSegment,
} from '../auth/user-profile.values';

interface Stats {
  orderCount: number;
  completedOrderCount: number;
  lifetimeValueCents: number;
  impactPlasticAvoidedGrams: number;
  impactCo2SavedKg: number;
  lastOrderAt: Timestamp | null;
}

async function syncCustomerProfiles(): Promise<void> {
  if (process.env.CONFIRM_CUSTOMER_SYNC !== 'eco-gifts-v2') {
    throw new Error('Set CONFIRM_CUSTOMER_SYNC=eco-gifts-v2 to continue.');
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const firebase = app.get(FirebaseAdminService);
    const stats = await loadStats(firebase);
    let pageToken: string | undefined;
    let synced = 0;
    do {
      const page = await firebase.auth.listUsers(500, pageToken);
      for (const group of chunks(page.users, 400)) {
        const batch = firebase.firestore.batch();
        group.forEach((user) => {
          const role = roleFromClaims(user.customClaims ?? {}) ?? Role.USER;
          const values = stats.get(user.uid) ?? emptyStats();
          batch.set(
            firebase.firestore.collection('users').doc(user.uid),
            {
              uid: user.uid,
              email: user.email ?? null,
              displayName: user.displayName ?? null,
              emailVerified: user.emailVerified,
              role,
              searchTerms: customerSearchTerms(
                user.displayName ?? null,
                user.email ?? null,
              ),
              ...values,
              hasOrders: values.orderCount > 0,
              repeatCustomer: values.orderCount >= 2,
              customerSegment: customerSegment(values.orderCount),
              createdAt: authCreatedAt(user.metadata.creationTime),
              updatedAt: Timestamp.now(),
              roles: FieldValue.delete(),
            },
            { merge: true },
          );
          synced += 1;
        });
        await batch.commit();
      }
      pageToken = page.pageToken;
    } while (pageToken);
    await firebase.firestore.collection('auditLogs').add({
      action: 'customers.profiles.synced',
      synced,
      createdAt: FieldValue.serverTimestamp(),
    });
    process.stdout.write(`Synchronized ${synced} customer profiles.\n`);
  } finally {
    await app.close();
  }
}

async function loadStats(firebase: FirebaseAdminService) {
  const snapshot = await firebase.firestore.collection('orders').get();
  const values = new Map<string, Stats>();
  snapshot.docs.forEach((order) => {
    const data = order.data();
    const userId = typeof data.userId === 'string' ? data.userId : null;
    const createdAt = data.createdAt;
    if (!userId || !(createdAt instanceof Timestamp)) return;
    const current = values.get(userId) ?? emptyStats();
    current.orderCount += 1;
    if (
      !current.lastOrderAt ||
      createdAt.toMillis() > current.lastOrderAt.toMillis()
    ) {
      current.lastOrderAt = createdAt;
    }
    if (data.paymentStatus === 'paid') addPaidOrder(current, data);
    values.set(userId, current);
  });
  return values;
}

function addPaidOrder(stats: Stats, data: FirebaseFirestore.DocumentData) {
  const impact =
    typeof data.impact === 'object' && data.impact ? data.impact : {};
  stats.completedOrderCount += 1;
  stats.lifetimeValueCents += safeNumber(data.totalCents);
  stats.impactPlasticAvoidedGrams += safeNumber(impact.plasticAvoidedGrams);
  stats.impactCo2SavedKg += safeNumber(impact.co2SavedKg);
}

function emptyStats(): Stats {
  return {
    orderCount: 0,
    completedOrderCount: 0,
    lifetimeValueCents: 0,
    impactPlasticAvoidedGrams: 0,
    impactCo2SavedKg: 0,
    lastOrderAt: null,
  };
}
function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}
function authCreatedAt(value: string): Timestamp {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? Timestamp.now()
    : Timestamp.fromDate(date);
}
function chunks<T>(values: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );
}

void syncCustomerProfiles();
