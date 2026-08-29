import { BadRequestException } from '@nestjs/common';
import {
  FieldValue,
  type DocumentReference,
  type Firestore,
  type Timestamp,
  type Transaction,
} from 'firebase-admin/firestore';
import { mapPromotion } from '../admin-promotions/admin-promotion.mapper';
import type {
  AdminPromotion,
  PromotionDiscount,
} from '../admin-promotions/admin-promotion.types';

export interface CheckoutPromotionUse {
  ref: DocumentReference;
  promotion: AdminPromotion;
}

export async function readCheckoutPromotion(
  transaction: Transaction,
  firestore: Firestore,
  code: string | undefined,
): Promise<CheckoutPromotionUse | null> {
  if (!code) return null;
  const codeSnapshot = await transaction.get(
    firestore.collection('promotionCodes').doc(code.trim().toLowerCase()),
  );
  const promotionId: unknown = codeSnapshot.get('promotionId');
  if (!codeSnapshot.exists || typeof promotionId !== 'string') invalid();
  const ref = firestore.collection('promotions').doc(promotionId);
  const snapshot = await transaction.get(ref);
  if (!snapshot.exists) invalid();
  const promotion = mapPromotion(snapshot.id, snapshot.data() ?? {});
  if (promotion.status !== 'active') invalid();
  return { ref, promotion };
}

export function redeemCheckoutPromotion(
  transaction: Transaction,
  use: CheckoutPromotionUse | null,
  orderId: string,
  createdAt: Timestamp,
  discount: PromotionDiscount | null,
  revenueCents: number,
): void {
  if (!use || !discount) return;
  transaction.update(use.ref, {
    redemptions: FieldValue.increment(1),
    attributedRevenueCents: FieldValue.increment(revenueCents),
    updatedAt: createdAt,
  });
  transaction.create(use.ref.collection('redemptions').doc(orderId), {
    orderId,
    code: discount.code,
    amountCents: discount.amountCents,
    revenueCents,
    createdAt,
  });
}
function invalid(): never {
  throw new BadRequestException('Promotion code is invalid or unavailable.');
}
