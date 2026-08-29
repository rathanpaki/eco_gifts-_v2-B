import { Injectable } from '@nestjs/common';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';

@Injectable()
export class PhoneVerificationRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async request(userId: string, phone: string) {
    const reference = this.user(userId);
    return this.firebase.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const alreadyVerified =
        normalizedPhone(snapshot.get('phone')) === normalizedPhone(phone) &&
        snapshot.get('phoneVerifiedAt') instanceof Timestamp;
      if (!alreadyVerified) {
        transaction.set(
          reference,
          {
            phone,
            phoneVerifiedAt: null,
            phoneVerificationPhone: phone,
            phoneVerificationRequestedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
      return alreadyVerified;
    });
  }

  async verify(
    userId: string,
    phone: string,
    lifetimeMs: number,
  ): Promise<boolean> {
    const reference = this.user(userId);
    return this.firebase.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const requestedAt: unknown = snapshot.get('phoneVerificationRequestedAt');
      const valid =
        snapshot.get('phoneVerificationPhone') === phone &&
        snapshot.get('phone') === phone &&
        requestedAt instanceof Timestamp &&
        Date.now() - requestedAt.toMillis() <= lifetimeMs;
      if (!valid) return false;
      transaction.set(
        reference,
        {
          phone,
          phoneVerifiedAt: FieldValue.serverTimestamp(),
          phoneVerificationPhone: FieldValue.delete(),
          phoneVerificationRequestedAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return true;
    });
  }

  private user(userId: string) {
    return this.firebase.firestore.collection('users').doc(userId);
  }
}

function normalizedPhone(value: unknown): string | null {
  return typeof value === 'string' && value.trim()
    ? value.replace(/[\s()-]/g, '')
    : null;
}
