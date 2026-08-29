import { Injectable } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { GiftProfileValues } from './account-saved.types';

@Injectable()
export class GiftProfilesRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  list(userId: string) {
    return this.collection(userId).orderBy('createdAt', 'asc').get();
  }

  async create(userId: string, values: GiftProfileValues) {
    const reference = this.collection(userId).doc();
    await reference.create({
      ...documentValues(values),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return reference.get();
  }

  async update(userId: string, id: string, values: GiftProfileValues) {
    const reference = this.collection(userId).doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists) return null;
    await reference.set(
      {
        ...documentValues(values),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return reference.get();
  }

  async remove(userId: string, id: string) {
    const reference = this.collection(userId).doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists) return false;
    await reference.delete();
    return true;
  }

  private collection(userId: string) {
    return this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('giftProfiles');
  }
}

function documentValues(values: GiftProfileValues) {
  return {
    recipientName: values.recipientName.trim(),
    relationship: values.relationship.trim(),
    occasion: values.occasion.trim(),
    importantDate: values.importantDate?.trim() || null,
    notes: values.notes?.trim() || null,
  };
}
