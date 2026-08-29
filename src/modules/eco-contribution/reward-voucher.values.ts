import { BadRequestException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { RewardDiscount, RewardVoucher } from './contribution.types';

export function mapRewardVoucher(
  value: DocumentData,
  now = Timestamp.now(),
): RewardVoucher {
  const createdAt = requiredTimestamp(value.createdAt);
  const expiresAt = requiredTimestamp(value.expiresAt);
  const redeemedAt = optionalTimestamp(value.redeemedAt);
  const status = redeemedAt
    ? 'redeemed'
    : expiresAt.toMillis() <= now.toMillis()
      ? 'expired'
      : 'active';
  return {
    id: text(value.id),
    code: text(value.code),
    discountCents: cents(value.discountCents),
    pointsCost: cents(value.pointsCost),
    createdAt: createdAt.toDate().toISOString(),
    expiresAt: expiresAt.toDate().toISOString(),
    redeemedAt: redeemedAt?.toDate().toISOString() ?? null,
    orderId: optionalText(value.orderId),
    status,
    isRedeemed: status === 'redeemed',
  };
}

export function rewardVoucherDiscount(
  value: DocumentData,
  userId: string,
  now = Timestamp.now(),
): RewardDiscount {
  const voucher = mapRewardVoucher(value, now);
  if (
    value.userId !== userId ||
    voucher.status !== 'active' ||
    voucher.discountCents <= 0
  ) {
    throw new BadRequestException('Reward voucher is invalid or unavailable.');
  }
  return {
    voucherId: voucher.id,
    code: voucher.code,
    amountCents: voucher.discountCents,
  };
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return invalid();
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function cents(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) return invalid();
  return value as number;
}

function requiredTimestamp(value: unknown): Timestamp {
  return value instanceof Timestamp ? value : invalid();
}

function optionalTimestamp(value: unknown): Timestamp | null {
  return value instanceof Timestamp ? value : null;
}

function invalid(): never {
  throw new BadRequestException('Stored reward voucher data is invalid.');
}
