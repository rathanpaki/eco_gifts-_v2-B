import { ConflictException, Injectable } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { mapOrder } from '../orders/order.mapper';
import { orderEventValues } from '../orders/order-event.values';
import type { Order } from '../orders/order.types';
import { adminSettingsFrom } from '../admin-settings/admin-settings.values';
import { saveCheckoutAddress } from './checkout-address.transaction';
import { readCheckoutCart } from './checkout-cart.transaction';
import { recordCustomerOrder } from './checkout-customer.values';
import { checkoutContributionRecords } from './checkout-contribution.values';
import {
  checkoutDigest,
  normalizedAddress,
  requestFingerprint,
  userCartIdentity,
} from './checkout-input.values';
import { buildOrder } from './checkout-order.document';
import { assertCheckoutPhoneVerified } from './checkout-phone.policy';
import { buildCheckoutQuote } from './checkout.policy';
import {
  assertConfiguredAddress,
  assertStorefrontActive,
} from './checkout-operations.policy';
import { recordCheckoutNotifications } from './checkout-notification.transaction';
import {
  readCheckoutPromotion,
  redeemCheckoutPromotion,
} from './checkout-promotion.transaction';
import { contributionRef, orderRef, treeRef } from './checkout-references';
import { reserveCheckoutStock } from './checkout-stock.transaction';
import type { CheckoutQuote, PlaceOrderInput } from './checkout.types';
import {
  readCheckoutVoucher,
  redeemCheckoutVoucher,
} from './checkout-voucher.transaction';

@Injectable()
export class CheckoutRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async place(user: AuthenticatedUser, input: PlaceOrderInput): Promise<Order> {
    const firestore = this.firebase.firestore;
    const id = checkoutDigest(`${user.uid}:${input.idempotencyKey}`);
    const fingerprint = requestFingerprint(input);
    const reference = orderRef(firestore, id);
    const eventRef = reference.collection('events').doc();
    const identity = userCartIdentity(user.uid);
    return firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) {
        if (existing.get('requestFingerprint') !== fingerprint)
          throw new ConflictException(
            'The order request key was already used for different details.',
          );
        return mapOrder(existing.id, existing.data() ?? {});
      }
      const settingsSnapshot = await transaction.get(
        firestore.collection('settings').doc('store'),
      );
      const settings = adminSettingsFrom(settingsSnapshot.data());
      assertStorefrontActive(settings);
      assertConfiguredAddress(input.address, settings);
      const context = await readCheckoutCart(transaction, firestore, identity);
      assertCheckoutPhoneVerified(context.userSnapshot, input.address.phone);
      const voucher = await readCheckoutVoucher(
        transaction,
        firestore,
        input.voucherId,
        user.uid,
      );
      const promotion = await readCheckoutPromotion(
        transaction,
        firestore,
        input.promoCode,
      );
      const createdAt = Timestamp.now();
      const quote = buildCheckoutQuote(
        context.cart,
        input,
        voucher?.discount,
        promotion?.promotion ?? null,
        settings,
      );
      reserveCheckoutStock(
        transaction,
        context.productSnapshots,
        quote.items,
        createdAt,
        id,
        user.uid,
      );
      const records = checkoutContributionRecords(quote, user, id, createdAt);
      const orderQuote: CheckoutQuote =
        records && quote.ecoContribution
          ? {
              ...quote,
              ecoContribution: {
                ...quote.ecoContribution,
                treeId: records.contribution.treeId,
              },
            }
          : quote;
      const built = buildOrder({
        id,
        quote: orderQuote,
        user,
        address: normalizedAddress(input.address),
        fingerprint,
        paymentMethod: input.paymentMethod,
        createdAt,
      });
      transaction.create(reference, built.document);
      redeemCheckoutVoucher(
        transaction,
        voucher,
        id,
        createdAt,
        orderQuote.rewardDiscount,
      );
      redeemCheckoutPromotion(
        transaction,
        promotion,
        id,
        createdAt,
        orderQuote.promotionDiscount,
        orderQuote.totalCents,
      );
      if (records) {
        transaction.create(
          contributionRef(firestore, records.contribution.id),
          records.contribution.document,
        );
        if (records.tree)
          transaction.create(
            treeRef(firestore, records.tree.id),
            records.tree.document,
          );
      }
      recordCustomerOrder(
        transaction,
        context.userReference,
        context.userSnapshot,
        user,
        createdAt,
        records?.contribution.rewardPointsEarned ?? 0,
      );
      saveCheckoutAddress(
        transaction,
        firestore,
        user.uid,
        normalizedAddress(input.address),
        createdAt,
      );
      recordCheckoutNotifications(
        transaction,
        firestore,
        settings,
        id,
        user.uid,
        orderQuote.items,
        context.productSnapshots,
        createdAt,
      );
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
      transaction.delete(context.cartReference);
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
}
