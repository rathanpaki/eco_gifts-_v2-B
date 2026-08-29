import { BadRequestException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import {
  mapRewardVoucher,
  rewardVoucherDiscount,
} from './reward-voucher.values';

const now = Timestamp.fromDate(new Date('2026-08-23T10:00:00.000Z'));

function stored(overrides: Record<string, unknown> = {}) {
  return {
    id: 'voucher_one',
    userId: 'customer_one',
    code: 'ECO-5-TEST',
    discountCents: 500,
    pointsCost: 100,
    createdAt: Timestamp.fromDate(new Date('2026-08-20T10:00:00.000Z')),
    expiresAt: Timestamp.fromDate(new Date('2026-09-20T10:00:00.000Z')),
    redeemedAt: null,
    orderId: null,
    ...overrides,
  };
}

describe('reward voucher values', () => {
  it('maps an active voucher and exposes its checkout discount', () => {
    expect(mapRewardVoucher(stored(), now)).toMatchObject({
      id: 'voucher_one',
      status: 'active',
      isRedeemed: false,
    });
    expect(rewardVoucherDiscount(stored(), 'customer_one', now)).toEqual({
      voucherId: 'voucher_one',
      code: 'ECO-5-TEST',
      amountCents: 500,
    });
  });

  it('rejects expired, redeemed, and foreign vouchers', () => {
    const expired = stored({
      expiresAt: Timestamp.fromDate(new Date('2026-08-22T10:00:00.000Z')),
    });
    const redeemed = stored({ redeemedAt: now, orderId: 'order_one' });

    expect(() => rewardVoucherDiscount(expired, 'customer_one', now)).toThrow(
      BadRequestException,
    );
    expect(() => rewardVoucherDiscount(redeemed, 'customer_one', now)).toThrow(
      BadRequestException,
    );
    expect(() => rewardVoucherDiscount(stored(), 'customer_two', now)).toThrow(
      BadRequestException,
    );
  });
});
