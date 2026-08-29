import type { PromotionDiscount } from '../admin-promotions/admin-promotion.types';
import type {
  CheckoutImpact,
  DeliveryOption,
  PackagingOption,
} from '../checkout/checkout.types';
import type {
  ContributionSummary,
  RewardDiscount,
} from '../eco-contribution/contribution.types';

export interface DeliveryAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode: string;
  countryCode: string;
  phone: string;
}

export interface OrderAddress extends Omit<DeliveryAddress, 'phone'> {
  phone: string | null;
}

export interface OrderImage {
  url: string;
  alt: string;
}

export interface OrderItem {
  itemId: string;
  productId: string;
  slug: string;
  name: string;
  image: OrderImage | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  ecoScore: number;
  customization: {
    id: string;
    previewPath: string;
    text: string | null;
  } | null;
}

export type PaymentMethod = 'pay_on_delivery' | 'demo_card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
export type DeliveryConfirmationStatus =
  'not_ready' | 'awaiting_customer' | 'confirmed';

export interface OrderTimelineEvent {
  id: string;
  status: FulfillmentStatus;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  address: OrderAddress;
  packaging: PackagingOption;
  delivery: DeliveryOption;
  impact: CheckoutImpact;
  ecoContribution: ContributionSummary | null;
  rewardDiscount: RewardDiscount | null;
  promotionDiscount: PromotionDiscount | null;
  subtotalCents: number;
  personalizationCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  deliveryConfirmationStatus: DeliveryConfirmationStatus;
  deliveryConfirmedAt: string | null;
  history: OrderTimelineEvent[];
  createdAt: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  totalQuantity: number;
  totalCents: number;
  currency: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  deliveryConfirmationStatus: DeliveryConfirmationStatus;
  deliveryConfirmedAt: string | null;
  estimatedDelivery: string;
  impact: CheckoutImpact;
  createdAt: string;
}

export interface OrderHistoryPage {
  items: OrderSummary[];
  nextCursor: string | null;
}

export interface OrderDocument {
  id: string;
  data: FirebaseFirestore.DocumentData;
}

export interface OrderDocumentPage {
  docs: OrderDocument[];
  nextCursor: string | null;
}
