import type { CartItem } from '../cart/cart.types';

export type PackagingOptionId =
  'recycled-box' | 'seed-paper-wrap' | 'zero-waste-cloth';
export type DeliveryOptionId = 'standard' | 'green-logistics';

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
  paymentMethod: 'pay_on_delivery';
  address: import('../orders/order.types').DeliveryAddress;
}

export interface CheckoutSelection {
  packagingId?: PackagingOptionId;
  deliveryId?: DeliveryOptionId;
}

export interface CheckoutQuote {
  items: CartItem[];
  packagingOptions: PackagingOption[];
  deliveryOptions: DeliveryOption[];
  packaging: PackagingOption;
  delivery: DeliveryOption;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  impact: CheckoutImpact;
  paymentMethod: 'pay_on_delivery';
}
