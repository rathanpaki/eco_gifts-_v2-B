import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { mapContribution, mapTreeRecord } from './contribution.mapper';
import type {
  EcoContribution,
  EcoImpactSummary,
  RewardDiscount,
  RewardVoucher,
  TreeRecord,
} from './contribution.types';
import {
  mapRewardVoucher,
  rewardVoucherDiscount,
} from './reward-voucher.values';

@Injectable()
export class EcoContributionService {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async summary(userId: string): Promise<EcoImpactSummary> {
    const [rewardPoints, contributions, trees, vouchers] = await Promise.all([
      this.getUserRewardBalance(userId),
      this.getUserContributions(userId),
      this.getUserTreeRecords(userId),
      this.getUserVouchers(userId),
    ]);
    return { rewardPoints, contributions, trees, vouchers };
  }

  async getUserContributions(userId: string): Promise<EcoContribution[]> {
    const snapshot = await this.firebase.firestore
      .collection('ecoContributions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    return snapshot.docs.map((document) => mapContribution(document.data()));
  }

  async getUserTreeRecords(userId: string): Promise<TreeRecord[]> {
    const snapshot = await this.firebase.firestore
      .collection('treeRecords')
      .where('userId', '==', userId)
      .get();
    return snapshot.docs
      .map((document) => mapTreeRecord(document.data()))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async getUserRewardBalance(userId: string): Promise<number> {
    const snapshot = await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .get();
    const value: unknown = snapshot.data()?.rewardPoints;
    return Number.isSafeInteger(value) && (value as number) >= 0
      ? (value as number)
      : 0;
  }

  async getUserVouchers(userId: string): Promise<RewardVoucher[]> {
    const snapshot = await this.firebase.firestore
      .collection('rewardVouchers')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    const now = Timestamp.now();
    return snapshot.docs.map((document) =>
      mapRewardVoucher(document.data(), now),
    );
  }

  async getVoucherDiscount(
    userId: string,
    voucherId: string,
  ): Promise<RewardDiscount> {
    const snapshot = await this.firebase.firestore
      .collection('rewardVouchers')
      .doc(voucherId)
      .get();
    if (!snapshot.exists) {
      throw new BadRequestException(
        'Reward voucher is invalid or unavailable.',
      );
    }
    return rewardVoucherDiscount(snapshot.data() ?? {}, userId);
  }
  async redeemRewardVoucher(
    userId: string,
    pointsCost = 100,
  ): Promise<RewardVoucher> {
    const userRef = this.firebase.firestore.collection('users').doc(userId);
    const voucherRef = this.firebase.firestore
      .collection('rewardVouchers')
      .doc();
    const code = `ECO-5-${randomBytes(4).toString('hex').toUpperCase()}`;
    const createdAt = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      createdAt.toMillis() + 30 * 86_400_000,
    );
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(userRef);
      const value: unknown = snapshot.data()?.rewardPoints;
      const points = Number.isSafeInteger(value) ? (value as number) : 0;
      if (points < pointsCost) {
        throw new BadRequestException('Insufficient reward points.');
      }
      transaction.update(userRef, {
        rewardPoints: FieldValue.increment(-pointsCost),
        updatedAt: createdAt,
      });
      transaction.create(voucherRef, {
        id: voucherRef.id,
        userId,
        code,
        discountCents: 500,
        pointsCost,
        createdAt,
        expiresAt,
        redeemedAt: null,
      });
    });
    return mapRewardVoucher({
      id: voucherRef.id,
      userId,
      code,
      discountCents: 500,
      pointsCost,
      createdAt,
      expiresAt,
      redeemedAt: null,
      orderId: null,
    });
  }
}
