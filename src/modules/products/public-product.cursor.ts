import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { PublicProductSort } from './product.types';

interface CursorPayload {
  v: 1;
  sort: PublicProductSort;
  id: string;
  value: number | string;
}

export function encodeProductCursor(
  id: string,
  data: DocumentData,
  sort: PublicProductSort,
): string {
  const payload: CursorPayload = {
    v: 1,
    sort,
    id,
    value: cursorValue(data, sort),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeProductCursor(
  encoded: string,
  expectedSort: PublicProductSort,
): [number | string | Timestamp, string] {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    );
    if (!isCursor(parsed) || parsed.sort !== expectedSort) throw new Error();
    const value =
      parsed.sort === 'newest'
        ? Timestamp.fromMillis(parsed.value as number)
        : parsed.value;
    return [value, parsed.id];
  } catch {
    throw new BadRequestException('The product cursor is invalid.');
  }
}

function cursorValue(
  data: DocumentData,
  sort: PublicProductSort,
): number | string {
  if (sort === 'newest') {
    const value: unknown = data.updatedAt;
    if (value instanceof Timestamp) return value.toMillis();
  } else if (sort === 'name-asc') {
    if (typeof data.name === 'string' && data.name) return data.name;
  } else {
    const field = sort === 'featured' ? 'featuredRank' : 'priceCents';
    const value: unknown = data[field];
    if (Number.isSafeInteger(value) && (value as number) >= 0) {
      return value as number;
    }
  }
  throw new InternalServerErrorException('Product sort data is invalid.');
}

function isCursor(value: unknown): value is CursorPayload {
  if (typeof value !== 'object' || value === null) return false;
  const cursor = value as Partial<CursorPayload>;
  const sorts: PublicProductSort[] = [
    'featured',
    'newest',
    'price-asc',
    'price-desc',
    'name-asc',
  ];
  const validValue =
    cursor.sort === 'name-asc'
      ? typeof cursor.value === 'string' && cursor.value.length > 0
      : Number.isSafeInteger(cursor.value) && (cursor.value as number) >= 0;
  return (
    cursor.v === 1 &&
    typeof cursor.sort === 'string' &&
    sorts.includes(cursor.sort) &&
    typeof cursor.id === 'string' &&
    /^[A-Za-z0-9_-]{1,128}$/.test(cursor.id) &&
    validValue
  );
}
