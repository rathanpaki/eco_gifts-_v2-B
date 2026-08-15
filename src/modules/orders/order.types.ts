import type {
  CheckoutImpact,
  DeliveryOption,
  PackagingOption,
} from '../checkout/checkout.types';

export interface DeliveryAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
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
  customization: { id: string; previewPath: string } | null;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderTimelineEvent {
  id: string;
  status: FulfillmentStatus;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  address: DeliveryAddress;
  packaging: PackagingOption;
  delivery: DeliveryOption;
  impact: CheckoutImpact;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: 'pay_on_delivery';
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
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
