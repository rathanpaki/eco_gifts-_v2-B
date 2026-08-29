import type { DocumentData } from 'firebase-admin/firestore';
import { mapOrder } from './order.mapper';
import type { OrderSummary } from './order.types';

export function mapOrderSummary(id: string, data: DocumentData): OrderSummary {
  const order = mapOrder(id, data);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    items: order.items,
    totalQuantity: order.items.reduce(
      (total, item) => total + item.quantity,
      0,
    ),
    totalCents: order.totalCents,
    currency: order.currency,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    deliveryConfirmationStatus: order.deliveryConfirmationStatus,
    deliveryConfirmedAt: order.deliveryConfirmedAt,
    estimatedDelivery: order.delivery.estimatedDays,
    impact: order.impact,
    createdAt: order.createdAt,
  };
}
