import { InternalServerErrorException } from '@nestjs/common';
import type { PromotionDiscount } from '../admin-promotions/admin-promotion.types';
import type {
  ContributionCause,
  ContributionSummary,
  RewardDiscount,
} from '../eco-contribution/contribution.types';

export function mapOrderContribution(
  value: unknown,
): ContributionSummary | null {
  if (value === undefined || value === null) return null;
  const data = record(value);
  return {
    cause: contributionCause(data.cause),
    amountCents: integer(data.amountCents),
    rewardPointsEarned: integer(data.rewardPointsEarned),
    treeId: optionalText(data.treeId),
  };
}
export function mapOrderRewardDiscount(value: unknown): RewardDiscount | null {
  if (value === undefined || value === null) return null;
  const data = record(value);
  return {
    voucherId: text(data.voucherId),
    code: text(data.code),
    amountCents: integer(data.amountCents),
  };
}
export function mapOrderPromotionDiscount(
  value: unknown,
): PromotionDiscount | null {
  if (value === undefined || value === null) return null;
  const data = record(value);
  const discountType = data.discountType;
  if (
    discountType !== 'percentage' &&
    discountType !== 'fixed' &&
    discountType !== 'free_delivery'
  )
    return invalid();
  return {
    id: text(data.id),
    code: text(data.code),
    name: text(data.name),
    discountType,
    amountCents: integer(data.amountCents),
  };
}
function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : invalid();
}
function text(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : invalid();
}
function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
function integer(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : invalid();
}
function contributionCause(value: unknown): ContributionCause {
  if (
    value === 'Tree Planting' ||
    value === 'Carbon Offset' ||
    value === 'Wildlife Conservation'
  )
    return value;
  return invalid();
}
function invalid(): never {
  throw new InternalServerErrorException('Stored order data is invalid.');
}
