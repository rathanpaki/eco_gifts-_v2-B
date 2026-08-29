import type { DocumentData } from 'firebase-admin/firestore';
import type { AccountNotification } from './account-notification.types';

export function giftProfileReminder(
  id: string,
  value: DocumentData,
  readAt: string | null,
  now = new Date(),
): AccountNotification | null {
  const date = parseDate(value.importantDate, now);
  if (!date) return null;
  const reminderAt = new Date(date);
  reminderAt.setUTCDate(reminderAt.getUTCDate() - 14);
  if (now < reminderAt || now > date) return null;
  const recipient = safeText(value.recipientName) || 'your recipient';
  const occasion = safeText(value.occasion) || 'occasion';
  const createdAt = reminderAt.toISOString();
  return {
    id: `gift-profile-${id}-${date.getUTCFullYear()}`,
    category: 'reminders',
    title: `${recipient}'s ${occasion} is coming up`,
    body: `You saved this date for ${formatDate(date)}. Browse a thoughtful gift while there is time to personalize it.`,
    createdAt,
    read: Boolean(readAt && createdAt <= readAt),
    href: '/account/gift-profiles',
    actionLabel: 'View profile',
  };
}

function parseDate(value: unknown, now: Date): Date | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  let date = new Date(Date.UTC(now.getUTCFullYear(), month, day, 12));
  if (date < now) {
    date = new Date(Date.UTC(now.getUTCFullYear() + 1, month, day, 12));
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
  }).format(value);
}
