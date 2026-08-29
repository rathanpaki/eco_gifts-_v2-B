import { ConflictException, NotFoundException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';

export function deliveryConfirmationDecision(
  order: DocumentData,
  userId: string,
): boolean {
  const owner: unknown = order.userId;
  if (owner !== userId) throw new NotFoundException('Order not found.');
  if (order.fulfillmentStatus !== 'delivered') {
    throw new ConflictException(
      'Delivery can be confirmed after it is marked delivered.',
    );
  }
  const confirmedAt: unknown = order.deliveryConfirmedAt;
  if (
    order.deliveryConfirmationStatus === 'confirmed' ||
    confirmedAt instanceof Timestamp
  ) {
    return false;
  }
  if (
    order.deliveryConfirmationStatus !== undefined &&
    order.deliveryConfirmationStatus !== null &&
    order.deliveryConfirmationStatus !== 'awaiting_customer'
  ) {
    throw new ConflictException('Stored delivery confirmation is invalid.');
  }
  return true;
}
