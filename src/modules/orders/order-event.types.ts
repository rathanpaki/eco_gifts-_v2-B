import type { FulfillmentStatus, OrderTimelineEvent } from './order.types';

export interface StoredOrderEvent extends OrderTimelineEvent {
  fromStatus: FulfillmentStatus | null;
  note: string | null;
  actorId: string;
  actorEmail: string | null;
  actorType: 'user' | 'admin';
}

export interface OrderEventWrite {
  fromStatus: FulfillmentStatus | null;
  toStatus: FulfillmentStatus;
  note: string | null;
  actorId: string;
  actorEmail: string | null;
  actorType: 'user' | 'admin';
}
