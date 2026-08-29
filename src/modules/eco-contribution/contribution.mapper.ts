import { BadRequestException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import type {
  ContributionCause,
  EcoContribution,
  TreeRecord,
} from './contribution.types';

export function mapContribution(
  value: Record<string, unknown>,
): EcoContribution {
  return {
    id: text(value.id),
    orderId: text(value.orderId),
    cause: cause(value.cause),
    amountCents: cents(value.amountCents),
    rewardPointsEarned: cents(value.rewardPointsEarned),
    treeId: optionalText(value.treeId),
    createdAt: timestamp(value.createdAt),
    status: status(value.status),
  };
}

export function mapTreeRecord(value: Record<string, unknown>): TreeRecord {
  return {
    treeId: text(value.treeId),
    cause: value.cause === undefined ? null : cause(value.cause),
    plantedDate: optionalTimestamp(value.plantedDate),
    partnerName: optionalText(value.partnerName),
    partnerLocation: optionalText(value.partnerLocation),
    certificateUrl: optionalText(value.certificateUrl),
    co2SequestrationKg: optionalNumber(value.co2SequestrationKg),
    status: status(value.status),
    createdAt: timestamp(value.createdAt),
  };
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) invalid();
  return value;
}
function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
function cents(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) invalid();
  return value as number;
}
function optionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
}
function timestamp(value: unknown): string {
  if (!(value instanceof Timestamp)) invalid();
  return value.toDate().toISOString();
}
function optionalTimestamp(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}
function cause(value: unknown): ContributionCause {
  if (
    value === 'Tree Planting' ||
    value === 'Carbon Offset' ||
    value === 'Wildlife Conservation'
  ) {
    return value;
  }
  return invalid();
}
function status(value: unknown): 'pending_verification' | 'verified' {
  if (value === 'pending_verification' || value === 'verified') return value;
  return invalid();
}
function invalid(): never {
  throw new BadRequestException('Stored eco-contribution data is invalid.');
}
