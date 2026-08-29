import type {
  DocumentSnapshot,
  Firestore,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore';
import type { AdminSettings } from '../admin-settings/admin-settings.types';
import type { CartItem } from '../cart/cart.types';

export function recordCheckoutNotifications(
  transaction: Transaction,
  firestore: Firestore,
  settings: AdminSettings,
  orderId: string,
  userId: string,
  items: CartItem[],
  products: DocumentSnapshot[],
  createdAt: Timestamp,
): void {
  if (settings.newOrderAlerts) {
    createNotification(transaction, firestore, `order_${orderId}`, {
      type: 'new_order',
      title: 'New order placed',
      orderId,
      userId,
      createdAt,
    });
  }
  if (!settings.lowStockDigest) return;
  products.forEach((product) => {
    const data = product.data() ?? {};
    const ordered = items
      .filter((item) => item.productId === product.id)
      .reduce((total, item) => total + item.quantity, 0);
    const remaining = Number(data.stockQuantity) - ordered;
    const threshold = Number(data.lowStockThreshold);
    if (ordered > 0 && remaining <= threshold) {
      createNotification(
        transaction,
        firestore,
        `low_stock_${orderId}_${product.id}`,
        {
          type: 'low_stock',
          title: 'Product reached its low-stock threshold',
          orderId,
          productId: product.id,
          remaining,
          createdAt,
        },
      );
    }
  });
}

function createNotification(
  transaction: Transaction,
  firestore: Firestore,
  id: string,
  values: Record<string, unknown>,
) {
  const reference = firestore.collection('adminNotifications').doc(id);
  transaction.set(reference, { id, read: false, ...values }, { merge: true });
}
