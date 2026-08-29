export type PromotionDiscountType = 'percentage' | 'fixed' | 'free_delivery';
export type PromotionScope = 'all' | 'collections' | 'products';
export type PromotionStatus = 'draft' | 'scheduled' | 'active' | 'ended';

export interface PromotionWrite {
  name: string;
  code: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  minimumBasketCents: number;
  appliesTo: PromotionScope;
  eligibleIds: string[];
  startsAt: string;
  endsAt: string;
  status: 'draft' | 'scheduled';
}

export interface AdminPromotion extends Omit<PromotionWrite, 'status'> {
  id: string;
  status: PromotionStatus;
  redemptions: number;
  attributedRevenueCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionMetrics {
  activeCount: number;
  attributedRevenueCents: number;
  averageDiscountPercent: number;
}

export interface AdminPromotionPage {
  items: AdminPromotion[];
  metrics: PromotionMetrics;
}

export interface PublicPromotion {
  id: string;
  name: string;
  code: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  minimumBasketCents: number;
  endsAt: string;
}

export interface PromotionDiscount {
  id: string;
  code: string;
  name: string;
  discountType: PromotionDiscountType;
  amountCents: number;
}
