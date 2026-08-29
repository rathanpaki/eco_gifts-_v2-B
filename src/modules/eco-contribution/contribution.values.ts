import { BadRequestException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import {
  CONTRIBUTION_CAUSES,
  type ContributionCause,
  type ContributionSelection,
  type ContributionSummary,
} from './contribution.types';
import { generateTreeId } from './tree-id-generator';

export const MIN_CONTRIBUTION_CENTS = 100;
export const MAX_CONTRIBUTION_CENTS = 50_000;

export function contributionSummary(
  cause?: ContributionCause,
  amountCents?: number,
): ContributionSummary | null {
  if (cause === undefined && amountCents === undefined) return null;
  if (
    !cause ||
    !CONTRIBUTION_CAUSES.includes(cause) ||
    amountCents === undefined ||
    !Number.isSafeInteger(amountCents) ||
    amountCents < MIN_CONTRIBUTION_CENTS ||
    amountCents > MAX_CONTRIBUTION_CENTS
  ) {
    throw new BadRequestException(
      'Choose a valid eco-contribution between 100 and 50000 cents.',
    );
  }
  return {
    cause,
    amountCents,
    rewardPointsEarned: Math.floor(amountCents / 10),
    treeId: null,
  };
}

export function contributionDocuments(input: {
  userId: string;
  orderId: string;
  selection: ContributionSelection;
  createdAt: Timestamp;
  customer?: { name?: string | null; email?: string | null };
}): {
  contribution: ContributionSummary & { id: string; document: DocumentData };
  tree: { id: string; document: DocumentData } | null;
} {
  const summary = contributionSummary(
    input.selection.cause,
    input.selection.amountCents,
  );
  if (!summary) {
    throw new BadRequestException('An eco-contribution selection is required.');
  }
  const id = `contribution_${input.orderId}`;
  const treeId = summary.cause === 'Tree Planting' ? generateTreeId() : null;
  const withTree = { ...summary, treeId };
  const contribution = {
    id,
    ...withTree,
    userId: input.userId,
    orderId: input.orderId,
    customerName: input.customer?.name?.trim() || null,
    customerEmail: input.customer?.email?.trim().toLowerCase() || null,
    createdAt: input.createdAt,
    status: 'pending_verification' as const,
  };
  return {
    contribution: { id, ...withTree, document: contribution },
    tree: treeId
      ? {
          id: treeId,
          document: {
            treeId,
            userId: input.userId,
            contributionId: id,
            cause: summary.cause,
            plantedDate: null,
            partnerName: null,
            partnerLocation: null,
            certificateUrl: null,
            co2SequestrationKg: null,
            status: 'pending_verification',
            createdAt: input.createdAt,
          },
        }
      : null,
  };
}
