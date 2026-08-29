import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';

@Injectable()
export class CustomerPrivacyRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async exportCollections(customerId: string) {
    const names = [
      'orders',
      'customizations',
      'ecoContributions',
      'treeRecords',
      'rewardVouchers',
    ] as const;
    const results = await Promise.all(
      names.map((name) =>
        this.firebase.firestore
          .collection(name)
          .where('userId', '==', customerId)
          .get(),
      ),
    );
    return Object.fromEntries(
      names.map((name, index) => [
        name,
        results[index].docs.map((document) => ({
          id: document.id,
          ...serializableRecord(document.data()),
        })),
      ]),
    );
  }
}

function serializableRecord(
  value: FirebaseFirestore.DocumentData,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, serializable(item)]),
  );
}

function serializable(value: unknown): unknown {
  if (isDateValue(value)) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializable(item)]),
    );
  }
  return value;
}

function isDateValue(value: unknown): value is { toDate(): Date } {
  if (!value || typeof value !== 'object' || !('toDate' in value)) return false;
  return typeof value.toDate === 'function';
}
