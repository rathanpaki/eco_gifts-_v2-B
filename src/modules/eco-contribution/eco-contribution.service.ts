import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { generateTreeId } from './tree-id-generator';

export type ContributionCause =
  'Tree Planting' | 'Carbon Offset' | 'Wildlife Conservation';

export interface CreateContributionInput {
  cause: ContributionCause;
  amountCents: number;
  orderId: string;
}

@Injectable()
export class EcoContributionService {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async recordContribution(userId: string, input: CreateContributionInput) {
    if (
      !Number.isSafeInteger(input.amountCents) ||
      input.amountCents < 100 ||
      input.amountCents > 50_000
    ) {
      throw new BadRequestException(
        'Contribution amount must be between 100 and 50000 cents.',
      );
    }
    const contributionRef = this.firebase.firestore
      .collection('ecoContributions')
      .doc();
    const treeId = input.cause === 'Tree Planting' ? generateTreeId() : null;
    const treeRef = treeId
      ? this.firebase.firestore.collection('treeRecords').doc(treeId)
      : null;
    const createdAt = Timestamp.now();
    const pointsEarned = Math.floor(input.amountCents / 10);
    const contribution = {
      id: contributionRef.id,
      userId,
      orderId: input.orderId,
      cause: input.cause,
      amountCents: input.amountCents,
      treeId,
      rewardPointsEarned: pointsEarned,
      createdAt,
      status: 'pending_verification',
    };
    const batch = this.firebase.firestore.batch();
    batch.create(contributionRef, contribution);
    if (treeRef && treeId) {
      batch.create(treeRef, {
        treeId,
        userId,
        contributionId: contributionRef.id,
        plantedDate: null,
        partnerName: null,
        partnerLocation: null,
        certificateUrl: null,
        co2SequestrationKg: null,
        status: 'pending_verification',
        createdAt,
      });
    }
    batch.set(
      this.firebase.firestore.collection('users').doc(userId),
      {
        rewardPoints: FieldValue.increment(pointsEarned),
        updatedAt: createdAt,
      },
      { merge: true },
    );
    await batch.commit();
    return { ...contribution, createdAt: createdAt.toDate().toISOString() };
  }

  async getUserTreeRecords(userId: string) {
    const snapshot = await this.firebase.firestore
      .collection('treeRecords')
      .where('userId', '==', userId)
      .get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
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

  async redeemRewardVoucher(userId: string, pointsCost = 100) {
    const userRef = this.firebase.firestore.collection('users').doc(userId);
    const voucherRef = this.firebase.firestore
      .collection('rewardVouchers')
      .doc();
    const code = `ECO-5-${randomBytes(4).toString('hex').toUpperCase()}`;
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(userRef);
      const value: unknown = snapshot.data()?.rewardPoints;
      const points = Number.isSafeInteger(value) ? (value as number) : 0;
      if (points < pointsCost) {
        throw new BadRequestException('Insufficient reward points.');
      }
      transaction.update(userRef, {
        rewardPoints: FieldValue.increment(-pointsCost),
        updatedAt: Timestamp.now(),
      });
      transaction.create(voucherRef, {
        id: voucherRef.id,
        userId,
        code,
        discountCents: 500,
        pointsCost,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + 30 * 86_400_000),
        redeemedAt: null,
      });
    });
    return { id: voucherRef.id, code, discountCents: 500, pointsCost };
  }
}
