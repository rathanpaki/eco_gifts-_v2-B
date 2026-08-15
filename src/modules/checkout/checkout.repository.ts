import { ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Timestamp, type DocumentReference } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { readOwnedCart } from '../cart/cart.documents';
import { mapCart } from '../cart/cart.mapper';
import type { CartIdentity } from '../cart/cart.types';
import { mapOrder } from '../orders/order.mapper';
import { orderEventValues } from '../orders/order-event.values';
import type { DeliveryAddress, Order } from '../orders/order.types';
import { buildOrder } from './checkout-order.document';
import { recordCustomerOrder } from './checkout-customer.values';
import { buildCheckoutQuote } from './checkout.policy';
import type { PlaceOrderInput } from './checkout.types';

@Injectable()
export class CheckoutRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async place(user: AuthenticatedUser, input: PlaceOrderInput): Promise<Order> {
    const id = digest(`${user.uid}:${input.idempotencyKey}`);
    const fingerprint = requestFingerprint(input);
    const orderRef = this.orderRef(id);
    const eventRef = orderRef.collection('events').doc();
    const identity = userCartIdentity(user.uid);
    return this.firebase.firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(orderRef);
      if (existing.exists) {
        if (existing.get('requestFingerprint') !== fingerprint) {
          throw new ConflictException(
            'The order request key was already used for different details.',
          );
        }
        return mapOrder(existing.id, existing.data() ?? {});
      }

      const cartRef = this.cartRef(identity.cartId);
      const userRef = this.userRef(user.uid);
      const [cartSnapshot, userSnapshot] = await Promise.all([
        transaction.get(cartRef),
        transaction.get(userRef),
      ]);
      const stored = readOwnedCart(cartSnapshot, identity);
      const productIds = [
        ...new Set(stored.items.map((item) => item.productId)),
      ];
      const productRefs = productIds.map((productId) =>
        this.productRef(productId),
      );
      const productSnapshots = productRefs.length
        ? await transaction.getAll(...productRefs)
        : [];
      const products = productSnapshots.map((item) => ({
        id: item.id,
        data: item.data() ?? {},
      }));
      const quote = buildCheckoutQuote(mapCart(stored, products), input);

      productSnapshots.forEach((snapshot) => {
        const orderedQuantity = quote.items
          .filter((entry) => entry.productId === snapshot.id)
          .reduce((total, item) => total + item.quantity, 0);
        if (!orderedQuantity) return;
        const data = snapshot.data() ?? {};
        const remaining = Number(data.stockQuantity) - orderedQuantity;
        const threshold = Number.isSafeInteger(data.lowStockThreshold)
          ? Number(data.lowStockThreshold)
          : 0;
        transaction.update(snapshot.ref, {
          stockQuantity: remaining,
          lowStock: remaining <= threshold,
          updatedAt: Timestamp.now(),
        });
      });

      const createdAt = Timestamp.now();
      const built = buildOrder({
        id,
        quote,
        user,
        address: normalizedAddress(input.address),
        fingerprint,
        createdAt,
      });
      transaction.create(orderRef, built.document);
      recordCustomerOrder(transaction, userRef, userSnapshot, user, createdAt);
      transaction.create(
        eventRef,
        orderEventValues(
          {
            fromStatus: null,
            toStatus: 'pending',
            note: null,
            actorId: user.uid,
            actorEmail: user.email,
            actorType: 'user',
          },
          createdAt,
        ),
      );
      transaction.delete(cartRef);
      return {
        ...built.order,
        history: [
          {
            id: eventRef.id,
            status: 'pending',
            createdAt: createdAt.toDate().toISOString(),
          },
        ],
      };
    });
  }

  private cartRef(id: string): DocumentReference {
    return this.firebase.firestore.collection('carts').doc(id);
  }
  private orderRef(id: string): DocumentReference {
    return this.firebase.firestore.collection('orders').doc(id);
  }
  private productRef(id: string): DocumentReference {
    return this.firebase.firestore.collection('products').doc(id);
  }
  private userRef(id: string): DocumentReference {
    return this.firebase.firestore.collection('users').doc(id);
  }
}

function userCartIdentity(uid: string): CartIdentity {
  return {
    cartId: `user_${digest(uid)}`,
    ownerId: uid,
    ownerType: 'user',
  };
}
function digest(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}
function requestFingerprint(input: PlaceOrderInput): string {
  return digest(
    JSON.stringify({
      packagingId: input.packagingId,
      deliveryId: input.deliveryId,
      paymentMethod: input.paymentMethod,
      address: normalizedAddress(input.address),
    }),
  );
}
function normalizedAddress(address: DeliveryAddress): DeliveryAddress {
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
    ...(address.phone?.trim() ? { phone: address.phone.trim() } : {}),
  };
}
