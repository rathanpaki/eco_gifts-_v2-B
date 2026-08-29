import { ConflictException, Injectable } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { PromotionWrite } from './admin-promotion.types';

@Injectable()
export class AdminPromotionsRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async list() {
    return this.promotions.orderBy('createdAt', 'desc').limit(100).get();
  }

  async findByCode(code: string) {
    const codeSnapshot = await this.codes.doc(code.trim().toLowerCase()).get();
    const promotionId: unknown = codeSnapshot.get('promotionId');
    if (!codeSnapshot.exists || typeof promotionId !== 'string') return null;
    return this.promotions.doc(promotionId).get();
  }

  get(id: string) {
    return this.promotions.doc(id).get();
  }

  async create(values: PromotionWrite) {
    const promotion = this.promotions.doc();
    const code = this.codes.doc(values.code.toLowerCase());
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(code);
      if (existing.exists) {
        throw new ConflictException('Promotion code already exists.');
      }
      const now = Timestamp.now();
      transaction.create(code, {
        promotionId: promotion.id,
        createdAt: now,
      });
      transaction.create(promotion, {
        ...values,
        startsAt: Timestamp.fromDate(new Date(values.startsAt)),
        endsAt: Timestamp.fromDate(new Date(values.endsAt)),
        redemptions: 0,
        attributedRevenueCents: 0,
        createdAt: now,
        updatedAt: now,
      });
    });
    return promotion.get();
  }

  async update(id: string, values: PromotionWrite) {
    const promotion = this.promotions.doc(id);
    const updated = await this.firebase.firestore.runTransaction(
      async (transaction) => {
        const existing = await transaction.get(promotion);
        if (!existing.exists) return false;
        const previousCode = String(existing.get('code') ?? '').toLowerCase();
        const nextCode = values.code.toLowerCase();
        if (previousCode !== nextCode) {
          const code = this.codes.doc(nextCode);
          const lock = await transaction.get(code);
          if (lock.exists && lock.get('promotionId') !== id) {
            throw new ConflictException('Promotion code already exists.');
          }
          transaction.set(code, {
            promotionId: id,
            createdAt: Timestamp.now(),
          });
          if (previousCode) transaction.delete(this.codes.doc(previousCode));
        }
        transaction.update(promotion, {
          ...values,
          startsAt: Timestamp.fromDate(new Date(values.startsAt)),
          endsAt: Timestamp.fromDate(new Date(values.endsAt)),
          updatedAt: Timestamp.now(),
        });
        return true;
      },
    );
    return updated ? promotion.get() : null;
  }

  async remove(id: string): Promise<boolean> {
    const promotion = this.promotions.doc(id);
    return this.firebase.firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(promotion);
      if (!existing.exists) return false;
      const code = String(existing.get('code') ?? '').toLowerCase();
      transaction.delete(promotion);
      if (code) transaction.delete(this.codes.doc(code));
      return true;
    });
  }

  private get promotions() {
    return this.firebase.firestore.collection('promotions');
  }

  private get codes() {
    return this.firebase.firestore.collection('promotionCodes');
  }
}
