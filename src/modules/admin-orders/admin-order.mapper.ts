import { InternalServerErrorException } from '@nestjs/common';
import type { DocumentData } from 'firebase-admin/firestore';
import { mapOrder } from '../orders/order.mapper';
import type { StoredOrderEvent } from '../orders/order-event.types';
import type { AdminOrder, AdminOrderSummary } from './admin-order.types';
import { allowedOrderTransitions } from './order-transition.policy';

export function mapAdminOrderSummary(
  id: string,
  data: DocumentData,
): AdminOrderSummary {
  const order = mapOrder(id, data);
  return {
    id,
    orderNumber: order.orderNumber,
    customerName: customerName(data, order.address.fullName),
    customerEmail: optionalText(data.customerEmail),
    totalCents: order.totalCents,
    currency: order.currency,
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    createdAt: order.createdAt,
  };
}

export function mapAdminOrder(
  id: string,
  data: DocumentData,
  events: StoredOrderEvent[],
): AdminOrder {
  const order = mapOrder(id, data);
  return {
    ...order,
    customerName: customerName(data, order.address.fullName),
    customerEmail: optionalText(data.customerEmail),
    history: events.map((event) => ({
      id: event.id,
      status: event.status,
      createdAt: event.createdAt,
    })),
    events,
    allowedTransitions: allowedOrderTransitions(order.fulfillmentStatus),
  };
}

function customerName(data: DocumentData, fallback: string): string {
  return optionalText(data.customerName) ?? fallback;
}

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return invalid();
  return value.trim() || null;
}

function invalid(): never {
  throw new InternalServerErrorException('Stored customer data is invalid.');
}
