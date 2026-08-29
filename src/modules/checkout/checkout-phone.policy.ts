import { BadRequestException } from '@nestjs/common';
import { Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';

export function assertCheckoutPhoneVerified(
  user: DocumentSnapshot,
  requestedPhone: string,
): void {
  const savedPhone = normalizePhone(user.get('phone'));
  const checkoutPhone = normalizePhone(requestedPhone);
  const verified = user.get('phoneVerifiedAt') instanceof Timestamp;
  if (!savedPhone || savedPhone !== checkoutPhone || !verified) {
    throw new BadRequestException(
      'Verify this phone number before placing your order.',
    );
  }
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[\s()-]/g, '');
  return normalized || null;
}
