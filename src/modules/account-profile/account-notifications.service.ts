import { Injectable } from '@nestjs/common';
import { object, text, timestamp } from '../cart/cart-value.mapper';
import { OrdersRepository } from '../orders/orders.repository';
import type {
  AccountNotification,
  AccountNotificationFeed,
} from './account-notification.types';
import { AccountProfileRepository } from './account-profile.repository';
import { GiftProfilesRepository } from './gift-profiles.repository';
import { giftProfileReminder } from './gift-profile-reminders';

@Injectable()
export class AccountNotificationsService {
  constructor(
    private readonly orders: OrdersRepository,
    private readonly profiles: AccountProfileRepository,
    private readonly giftProfiles: GiftProfilesRepository,
  ) {}

  async feed(userId: string): Promise<AccountNotificationFeed> {
    const [orders, readAt, preferences, giftProfiles] = await Promise.all([
      this.orders.list(userId, 20),
      this.profiles.notificationReadAt(userId),
      this.profiles.preferences(userId),
      this.giftProfiles.list(userId),
    ]);
    const orderItems = orders.docs
      .map((order) => notification(order.id, order.data, readAt))
      .filter((item): item is AccountNotification => item !== null);
    const reminders =
      preferences?.occasionReminders === false
        ? []
        : giftProfiles.docs
            .map((profile) =>
              giftProfileReminder(profile.id, profile.data(), readAt),
            )
            .filter((item): item is AccountNotification => item !== null);
    const items = [...orderItems, ...reminders].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    return {
      items,
      unreadCount: items.filter((item) => !item.read).length,
    };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.profiles.markNotificationsRead(userId);
  }
}

function notification(
  id: string,
  value: FirebaseFirestore.DocumentData,
  readAt: string | null,
): AccountNotification | null {
  const status = text(value.fulfillmentStatus);
  const orderNumber = text(value.orderNumber);
  const createdAt = timestamp(value.updatedAt) || timestamp(value.createdAt);
  if (!createdAt || !orderNumber) return null;
  const copy = notificationCopy(status, orderNumber, object(value.delivery));
  return {
    id: `order-${id}-${status}`,
    category: 'orders',
    ...copy,
    createdAt,
    read: Boolean(readAt && createdAt <= readAt),
    href: `/orders/${id}`,
    actionLabel: status === 'shipped' ? 'Track order' : 'View order',
  };
}

function notificationCopy(
  status: string,
  orderNumber: string,
  delivery: FirebaseFirestore.DocumentData,
) {
  const labels: Record<string, string> = {
    pending: 'Your order was received',
    confirmed: 'Your gift is confirmed',
    processing: 'Your gift is being prepared',
    shipped: 'Your gift is on the way',
    delivered: 'Your gift was delivered',
    cancelled: 'Your order was cancelled',
  };
  const title = labels[status] ?? 'Your order was updated';
  const estimate = text(delivery.estimatedDays);
  const body =
    status === 'shipped' && estimate
      ? `Order ${orderNumber} is in transit. Estimated delivery: ${estimate}.`
      : `Order ${orderNumber} is now ${status || 'updated'}.`;
  return { title, body };
}
