import type { CartItem } from '../cart/cart.types';
import type { PaymentMethod } from '../orders/order.types';
import type { PromotionDiscount } from '../admin-promotions/admin-promotion.types';
import type {
  ContributionCause,
  ContributionSummary,
  RewardDiscount,
} from '../eco-contribution/contribution.types';

export type PackagingOptionId =
  'recycled-box' | 'seed-paper-wrap' | 'zero-waste-cloth';
export type DeliveryOptionId = 'standard' | 'express' | 'green-logistics';

export interface PackagingOption {
  id: PackagingOptionId;
  name: string;
  description: string;
  priceCents: number;
  co2SavingsKg: number;
  plasticAvoidedGrams: number;
  ecoBonusPoints: number;
}

export interface DeliveryOption {
  id: DeliveryOptionId;
  name: string;
  description: string;
  priceCents: number;
  co2OffsetKg: number;
  ecoBonusPoints: number;
  estimatedDays: string;
}

export interface CheckoutImpact {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C';
  co2SavedKg: number;
  plasticAvoidedGrams: number;
  methodologyVersion: string;
  estimated: true;
}

export interface PlaceOrderInput {
  idempotencyKey: string;
  packagingId: PackagingOptionId;
  deliveryId: DeliveryOptionId;
  paymentMethod: PaymentMethod;
  address: import('../orders/order.types').DeliveryAddress;
  contributionCause?: ContributionCause;
  contributionAmountCents?: number;
  voucherId?: string;
  promoCode?: string;
}

export interface CheckoutSelection {
  packagingId?: PackagingOptionId;
  deliveryId?: DeliveryOptionId;
  contributionCause?: ContributionCause;
  contributionAmountCents?: number;
  voucherId?: string;
  promoCode?: string;
}

export interface CheckoutQuote {
  items: CartItem[];
  packagingOptions: PackagingOption[];
  deliveryOptions: DeliveryOption[];
  packaging: PackagingOption;
  delivery: DeliveryOption;
  subtotalCents: number;
  personalizationCents: number;
  totalCents: number;
  currency: string;
  impact: CheckoutImpact;
  ecoContribution: ContributionSummary | null;
  rewardDiscount: RewardDiscount | null;
  promotionDiscount: PromotionDiscount | null;
  paymentMethod: PaymentMethod;
}
