import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import type { CheckoutQuote } from './checkout.types';
import type { DeliveryAddress, Order } from '../orders/order.types';

interface BuildOrderInput {
  id: string;
  quote: CheckoutQuote;
  user: AuthenticatedUser;
  address: DeliveryAddress;
  fingerprint: string;
  createdAt: Timestamp;
}

export function buildOrder(input: BuildOrderInput): {
  order: Order;
  document: DocumentData;
} {
  const items = input.quote.items.map((item) => ({
    itemId: item.itemId,
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    image: item.image,
    unitPriceCents: item.priceCents,
    quantity: item.quantity,
    lineTotalCents: item.lineTotalCents,
    ecoScore: item.ecoScore,
    customization: item.customization,
  }));
  const createdAt = input.createdAt.toDate().toISOString();
  const order: Order = {
    id: input.id,
    orderNumber: orderNumber(input.id, input.createdAt),
    items,
    address: input.address,
    packaging: input.quote.packaging,
    delivery: input.quote.delivery,
    impact: input.quote.impact,
    subtotalCents: input.quote.subtotalCents,
    totalCents: input.quote.totalCents,
    currency: input.quote.currency,
    paymentMethod: 'pay_on_delivery',
    paymentStatus: 'pending',
    fulfillmentStatus: 'pending',
    history: [],
    createdAt,
  };
  return {
    order,
    document: {
      ...order,
      userId: input.user.uid,
      customerName: input.user.displayName ?? input.address.fullName,
      customerEmail: input.user.email,
      requestFingerprint: input.fingerprint,
      taxIncluded: true,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    },
  };
}

function orderNumber(id: string, createdAt: Timestamp): string {
  const date = createdAt
    .toDate()
    .toISOString()
    .slice(0, 10)
    .replaceAll('-', '');
  return `EG-${date}-${id.slice(0, 8).toUpperCase()}`;
}
