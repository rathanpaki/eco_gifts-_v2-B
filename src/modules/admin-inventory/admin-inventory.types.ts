export type InventoryEventType =
  'sale' | 'sale_reversal' | 'restock' | 'adjustment';

export interface InventoryEvent {
  id: string;
  productId: string;
  productName: string;
  orderId: string | null;
  type: InventoryEventType;
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  actorId: string;
  actorEmail: string | null;
  createdAt: string;
}

export interface InventoryAdjustmentInput {
  kind: 'restock' | 'adjustment';
  quantityDelta: number;
  reason: string;
}
