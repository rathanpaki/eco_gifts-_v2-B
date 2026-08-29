export type AccountNotificationCategory = 'orders' | 'reminders' | 'impact';

export interface AccountNotification {
  id: string;
  category: AccountNotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
  actionLabel: string;
}

export interface AccountNotificationFeed {
  items: AccountNotification[];
  unreadCount: number;
}
