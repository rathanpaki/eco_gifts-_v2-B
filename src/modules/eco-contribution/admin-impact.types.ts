import type { ContributionCause, EcoContribution } from './contribution.types';

export type AdminImpactStatus = 'all' | 'pending_verification' | 'verified';

export interface AdminImpactItem extends EcoContribution {
  userId: string;
  customerName: string | null;
  customerEmail: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface AdminImpactMetrics {
  total: number;
  pending: number;
  verified: number;
  totalAmountCents: number;
  treeCount: number;
}

export interface AdminImpactTrendPoint {
  month: string;
  label: string;
  amountCents: number;
  contributionCount: number;
}

export interface AdminImpactPage {
  items: AdminImpactItem[];
  metrics: AdminImpactMetrics;
  trend: AdminImpactTrendPoint[];
}

export interface AdminImpactQuery {
  status: AdminImpactStatus;
  cause: 'all' | ContributionCause;
  search?: string;
  limit: number;
}

export interface VerifyImpactInput {
  partnerName?: string;
  partnerLocation?: string;
  plantedDate?: string;
  certificateUrl?: string;
  co2SequestrationKg?: number;
}
