import { Injectable } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { PaymentMethodValues } from './account-saved.types';

@Injectable()
export class PaymentMethodsRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  list(userId: string) {
    return this.collection(userId).orderBy('createdAt', 'asc').get();
  }

  async create(userId: string, values: PaymentMethodValues) {
    const collection = this.collection(userId);
    const existing = await collection.get();
    const reference = collection.doc();
    const primary = values.primary || existing.empty;
    const batch = this.firebase.firestore.batch();
    if (primary) {
      existing.docs.forEach((document) =>
        batch.set(document.ref, { primary: false }, { merge: true }),
      );
    }
    batch.create(reference, {
      cardholderName: values.cardholderName.trim(),
      brand: values.brand,
      lastFour: values.lastFour,
      expiryMonth: values.expiryMonth,
      expiryYear: values.expiryYear,
      primary,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
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
      .collection('paymentMethods');
  }
}
