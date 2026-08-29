import type { DocumentData } from 'firebase-admin/firestore';
import { integer, text, timestamp } from '../cart/cart-value.mapper';
import type {
  AdminPromotion,
  PromotionDiscountType,
  PromotionScope,
  PromotionStatus,
} from './admin-promotion.types';

export function mapPromotion(
  id: string,
  value: DocumentData,
  now = Date.now(),
): AdminPromotion {
  const startsAt = timestamp(value.startsAt);
  const endsAt = timestamp(value.endsAt);
  return {
    id,
    name: text(value.name),
    code: text(value.code),
    discountType: discountType(value.discountType),
    discountValue: integer(value.discountValue),
    minimumBasketCents: integer(value.minimumBasketCents),
    appliesTo: scope(value.appliesTo),
    eligibleIds: stringList(value.eligibleIds),
    startsAt,
    endsAt,
    status: status(text(value.status), startsAt, endsAt, now),
    redemptions: integer(value.redemptions),
    attributedRevenueCents: integer(value.attributedRevenueCents),
    createdAt: timestamp(value.createdAt),
    updatedAt: timestamp(value.updatedAt),
  };
}

function status(
  stored: string,
  startsAt: string,
  endsAt: string,
  now: number,
): PromotionStatus {
  if (stored === 'draft') return 'draft';
  if (new Date(startsAt).getTime() > now) return 'scheduled';
  if (new Date(endsAt).getTime() < now) return 'ended';
  return 'active';
}

function discountType(value: unknown): PromotionDiscountType {
  return value === 'fixed' || value === 'free_delivery' ? value : 'percentage';
}

function scope(value: unknown): PromotionScope {
  return value === 'collections' || value === 'products' ? value : 'all';
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
