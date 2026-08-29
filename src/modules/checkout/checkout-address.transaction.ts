import { createHash } from 'node:crypto';
import type {
  Firestore,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore';
import type { DeliveryAddress } from '../orders/order.types';

export function saveCheckoutAddress(
  transaction: Transaction,
  firestore: Firestore,
  userId: string,
  address: DeliveryAddress,
  updatedAt: Timestamp,
): void {
  const key = [
    address.fullName,
    address.addressLine1,
    address.city,
    address.postalCode,
    address.countryCode,
  ]
    .join('|')
    .toLowerCase();
  const id = createHash('sha256').update(key).digest('base64url').slice(0, 32);
  const reference = firestore
    .collection('users')
    .doc(userId)
    .collection('addresses')
    .doc(id);
  transaction.set(
    reference,
    {
      label: 'Checkout',
      fullName: address.fullName,
      line1: address.addressLine1,
      line2: address.addressLine2 ?? null,
      city: address.city,
      region: address.region ?? null,
      postalCode: address.postalCode,
      country: address.countryCode,
      countryCode: address.countryCode,
      phone: address.phone,
      primary: false,
      createdAt: updatedAt,
      updatedAt,
    },
    { merge: true },
  );
}
