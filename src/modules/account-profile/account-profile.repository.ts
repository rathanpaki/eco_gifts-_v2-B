import { Injectable } from '@nestjs/common';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { addressDocument } from './account-address.values';
import type { AddressValues, GiftPreferences } from './account-profile.types';

@Injectable()
export class AccountProfileRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async profile(userId: string) {
    return this.users.doc(userId).get();
  }

  async updateProfile(userId: string, displayName: string, phone?: string) {
    const reference = this.users.doc(userId);
    const nextPhone = phone?.trim() || null;
    await this.firebase.auth.updateUser(userId, { displayName });
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      const storedPhone = optionalText(existing.get('phone'));
      transaction.set(
        reference,
        {
          displayName,
          phone: nextPhone,
          updatedAt: FieldValue.serverTimestamp(),
          ...(canonicalPhone(storedPhone) === canonicalPhone(nextPhone)
            ? {}
            : {
                phoneVerifiedAt: null,
                phoneVerificationPhone: null,
                phoneVerificationRequestedAt: null,
              }),
        },
        { merge: true },
      );
    });
  }

  async addresses(userId: string) {
    return this.addressesCollection(userId).orderBy('createdAt', 'asc').get();
  }

  async createAddress(userId: string, values: AddressValues) {
    const collection = this.addressesCollection(userId);
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
      ...addressDocument(values, primary),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return reference.get();
  }

  async updateAddress(
    userId: string,
    addressId: string,
    values: AddressValues,
  ) {
    const collection = this.addressesCollection(userId);
    const reference = collection.doc(addressId);
    const snapshot = await reference.get();
    if (!snapshot.exists) return null;
    const batch = this.firebase.firestore.batch();
    if (values.primary) {
      const existing = await collection.get();
      existing.docs.forEach((document) => {
        if (document.id !== addressId) {
          batch.set(document.ref, { primary: false }, { merge: true });
        }
      });
    }
    batch.set(
      reference,
      {
        ...addressDocument(values, values.primary),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    await batch.commit();
    return reference.get();
  }

  async deleteAddress(userId: string, addressId: string) {
    const reference = this.addressesCollection(userId).doc(addressId);
    const snapshot = await reference.get();
    if (!snapshot.exists) return false;
    await reference.delete();
    return true;
  }

  async preferences(userId: string): Promise<Partial<GiftPreferences> | null> {
    const profile = await this.profile(userId);
    const stored: unknown = profile.get('giftPreferences');
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      return null;
    }
    return stored;
  }

  async updatePreferences(userId: string, values: GiftPreferences) {
    await this.users.doc(userId).set(
      {
        giftPreferences: values,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  async notificationReadAt(userId: string): Promise<string | null> {
    const profile = await this.profile(userId);
    const value: unknown = profile.get('notificationsReadAt');
    return value instanceof Timestamp ? value.toDate().toISOString() : null;
  }

  async markNotificationsRead(userId: string): Promise<void> {
    await this.users
      .doc(userId)
      .set(
        { notificationsReadAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
  }

  private get users() {
    return this.firebase.firestore.collection('users');
  }

  private addressesCollection(userId: string) {
    return this.users.doc(userId).collection('addresses');
  }
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function canonicalPhone(value: string | null): string | null {
  return value?.replace(/[\s()-]/g, '') || null;
}
