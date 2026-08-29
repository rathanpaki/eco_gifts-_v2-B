import { BadRequestException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { mapContribution } from './contribution.mapper';
import type { AdminImpactItem } from './admin-impact.types';

export function mapAdminImpact(data: DocumentData): AdminImpactItem {
  const contribution = mapContribution(data);
  return {
    ...contribution,
    userId: requiredText(data.userId),
    customerName: optionalText(data.customerName),
    customerEmail: optionalText(data.customerEmail),
    verifiedAt: optionalTimestamp(data.verifiedAt),
    verifiedBy: optionalText(data.verifiedBy),
  };
}

function requiredText(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException('Stored impact data is invalid.');
  }
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function optionalTimestamp(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}
