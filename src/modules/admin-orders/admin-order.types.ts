import type { StoredOrderEvent } from '../orders/order-event.types';
import type {
  FulfillmentStatus,
  Order,
  PaymentStatus,
} from '../orders/order.types';

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  totalCents: number;
  currency: string;
  itemCount: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
}

export interface AdminOrder extends Order {
  customerName: string;
  customerEmail: string | null;
  allowedTransitions: FulfillmentStatus[];
  events: StoredOrderEvent[];
}

export interface AdminOrderMetrics {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface AdminOrderPage {
  items: AdminOrderSummary[];
  metrics: AdminOrderMetrics;
  nextCursor: string | null;
}

export interface AdminOrderDocument {
  id: string;
  data: FirebaseFirestore.DocumentData;
}
