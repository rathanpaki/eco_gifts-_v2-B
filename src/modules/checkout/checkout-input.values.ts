import { createHash } from 'node:crypto';
import type { CartIdentity } from '../cart/cart.types';
import type { DeliveryAddress } from '../orders/order.types';
import type { PlaceOrderInput } from './checkout.types';

export function requestFingerprint(input: PlaceOrderInput): string {
  return checkoutDigest(
    JSON.stringify({
      packagingId: input.packagingId,
      deliveryId: input.deliveryId,
      contributionCause: input.contributionCause ?? null,
      contributionAmountCents: input.contributionAmountCents ?? null,
      voucherId: input.voucherId ?? null,
      promoCode: input.promoCode?.trim().toUpperCase() ?? null,
      paymentMethod: input.paymentMethod,
      address: normalizedAddress(input.address),
    }),
  );
}

export function userCartIdentity(uid: string): CartIdentity {
  return {
    cartId: `user_${checkoutDigest(uid)}`,
    ownerId: uid,
    ownerType: 'user',
  };
}

export function normalizedAddress(address: DeliveryAddress): DeliveryAddress {
  return {
    fullName: address.fullName.trim(),
    addressLine1: address.addressLine1.trim(),
    ...(address.addressLine2?.trim()
      ? { addressLine2: address.addressLine2.trim() }
      : {}),
    city: address.city.trim(),
    ...(address.region?.trim() ? { region: address.region.trim() } : {}),
    postalCode: address.postalCode.trim(),
    countryCode: address.countryCode.trim().toUpperCase(),
    phone: address.phone.trim(),
  };
}

export function checkoutDigest(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}
