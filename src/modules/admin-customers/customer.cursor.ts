import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';

interface Payload {
  v: 1;
  id: string;
  createdAt: number;
}

export function encodeCustomerCursor(id: string, data: DocumentData): string {
  const createdAt: unknown = data.createdAt;
  if (!(createdAt instanceof Timestamp)) {
    throw new InternalServerErrorException('Customer cursor data is invalid.');
  }
  const payload: Payload = { v: 1, id, createdAt: createdAt.toMillis() };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCustomerCursor(value: string): [Timestamp, string] {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    if (!isPayload(parsed)) throw new Error('invalid');
    return [Timestamp.fromMillis(parsed.createdAt), parsed.id];
  } catch {
    throw new BadRequestException('The customer cursor is invalid.');
  }
}

function isPayload(value: unknown): value is Payload {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Partial<Payload>;
  return (
    payload.v === 1 &&
    typeof payload.id === 'string' &&
    /^[A-Za-z0-9_-]{20,128}$/.test(payload.id) &&
    Number.isSafeInteger(payload.createdAt) &&
    (payload.createdAt as number) >= 0
  );
}
