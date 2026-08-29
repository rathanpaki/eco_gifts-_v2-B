import type { DocumentData } from 'firebase-admin/firestore';

export function reviewEligibility(
  order: DocumentData,
  userId: string,
  productId: string,
): string | null {
  if (order.userId !== userId) return 'Order not found.';
  if (
    order.fulfillmentStatus !== 'delivered' ||
    order.deliveryConfirmationStatus !== 'confirmed'
  ) {
    return 'Confirm delivery before reviewing products from this order.';
  }
  const items = Array.isArray(order.items) ? order.items : [];
  const purchased = items.some(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      (item as DocumentData).productId === productId,
  );
  return purchased ? null : 'This product was not part of the order.';
}
