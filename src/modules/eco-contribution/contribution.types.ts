export const CONTRIBUTION_CAUSES = [
  'Tree Planting',
  'Carbon Offset',
  'Wildlife Conservation',
] as const;

export type ContributionCause = (typeof CONTRIBUTION_CAUSES)[number];

export interface ContributionSelection {
  cause: ContributionCause;
  amountCents: number;
}

export interface ContributionSummary extends ContributionSelection {
  rewardPointsEarned: number;
  treeId: string | null;
}

export interface EcoContribution extends ContributionSummary {
  id: string;
  orderId: string;
  createdAt: string;
  status: 'pending_verification' | 'verified';
}

export interface TreeRecord {
  treeId: string;
  cause: ContributionCause | null;
  plantedDate: string | null;
  partnerName: string | null;
  partnerLocation: string | null;
  certificateUrl: string | null;
  co2SequestrationKg: number | null;
  status: 'pending_verification' | 'verified';
  createdAt: string;
}

export interface EcoImpactSummary {
  rewardPoints: number;
  contributions: EcoContribution[];
  trees: TreeRecord[];
  vouchers: RewardVoucher[];
}

export type RewardVoucherStatus = 'active' | 'redeemed' | 'expired';

export interface RewardDiscount {
  voucherId: string;
  code: string;
  amountCents: number;
}

export interface RewardVoucher {
  id: string;
  code: string;
  discountCents: number;
  pointsCost: number;
  createdAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  orderId: string | null;
  status: RewardVoucherStatus;
  isRedeemed: boolean;
}
