import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type {
  DeliveryConfirmationStatus,
  FulfillmentStatus,
} from './order.types';

export function mapDeliveryConfirmation(
  data: DocumentData,
  fulfillmentStatus: FulfillmentStatus,
): {
  deliveryConfirmationStatus: DeliveryConfirmationStatus;
  deliveryConfirmedAt: string | null;
} {
  if (fulfillmentStatus !== 'delivered') {
    return {
      deliveryConfirmationStatus: 'not_ready',
      deliveryConfirmedAt: null,
    };
  }
  const confirmedAt = nullableTimestamp(data.deliveryConfirmedAt);
  const status: unknown = data.deliveryConfirmationStatus;
  if (status === 'confirmed' || confirmedAt) {
    if (!confirmedAt) return invalid();
    return {
      deliveryConfirmationStatus: 'confirmed',
      deliveryConfirmedAt: confirmedAt,
    };
  }
  if (
    status === undefined ||
    status === null ||
    status === 'awaiting_customer'
  ) {
    return {
      deliveryConfirmationStatus: 'awaiting_customer',
      deliveryConfirmedAt: null,
    };
  }
  return invalid();
}

function nullableTimestamp(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return value instanceof Timestamp ? value.toDate().toISOString() : invalid();
}

function invalid(): never {
  throw new InternalServerErrorException(
    'Stored delivery confirmation is invalid.',
  );
}
