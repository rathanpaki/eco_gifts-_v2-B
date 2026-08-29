import { BadRequestException } from '@nestjs/common';
import {
  Timestamp,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from 'firebase-admin/firestore';
import type { RewardDiscount } from '../eco-contribution/contribution.types';
import { rewardVoucherDiscount } from '../eco-contribution/reward-voucher.values';

export interface CheckoutVoucherUse {
  ref: DocumentReference;
  discount: RewardDiscount;
}

export async function readCheckoutVoucher(
  transaction: Transaction,
  firestore: Firestore,
  voucherId: string | undefined,
  userId: string,
): Promise<CheckoutVoucherUse | null> {
  if (!voucherId) return null;
  const ref = firestore.collection('rewardVouchers').doc(voucherId);
  const snapshot = await transaction.get(ref);
  if (!snapshot.exists) {
    throw new BadRequestException('Reward voucher is invalid or unavailable.');
  }
  return {
    ref,
    discount: rewardVoucherDiscount(snapshot.data() ?? {}, userId),
  };
}

export function redeemCheckoutVoucher(
  transaction: Transaction,
  voucher: CheckoutVoucherUse | null,
  orderId: string,
  redeemedAt: Timestamp,
  applied: RewardDiscount | null,
): void {
  if (!voucher || !applied) return;
  transaction.update(voucher.ref, {
    redeemedAt,
    orderId,
    appliedDiscountCents: applied.amountCents,
  });
}
