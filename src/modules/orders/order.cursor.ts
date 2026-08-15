import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';

interface OrderCursorPayload {
  v: 1;
  id: string;
  createdAt: number;
}

export function encodeOrderCursor(id: string, data: DocumentData): string {
  const createdAt: unknown = data.createdAt;
  if (!(createdAt instanceof Timestamp)) {
    throw new InternalServerErrorException('Order cursor data is invalid.');
  }
  const payload: OrderCursorPayload = {
    v: 1,
    id,
    createdAt: createdAt.toMillis(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeOrderCursor(encoded: string): [Timestamp, string] {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    );
    if (!isOrderCursor(value)) throw new Error();
    return [Timestamp.fromMillis(value.createdAt), value.id];
  } catch {
    throw new BadRequestException('The order cursor is invalid.');
  }
}

function isOrderCursor(value: unknown): value is OrderCursorPayload {
  if (typeof value !== 'object' || value === null) return false;
  const cursor = value as Partial<OrderCursorPayload>;
  return (
    cursor.v === 1 &&
    typeof cursor.id === 'string' &&
    /^[A-Za-z0-9_-]{20,64}$/.test(cursor.id) &&
    Number.isSafeInteger(cursor.createdAt) &&
    (cursor.createdAt as number) >= 0
  );
}
