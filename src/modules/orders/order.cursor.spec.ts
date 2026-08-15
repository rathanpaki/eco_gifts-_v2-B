import { BadRequestException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { decodeOrderCursor, encodeOrderCursor } from './order.cursor';

describe('order cursor', () => {
  it('round trips a stable timestamp and document ID', () => {
    const id = 'AbCdEfGhIjKlMnOpQrSt';
    const createdAt = Timestamp.fromMillis(1_786_428_000_000);
    const encoded = encodeOrderCursor(id, { createdAt });

    const [decodedTime, decodedId] = decodeOrderCursor(encoded);

    expect(decodedTime.toMillis()).toBe(createdAt.toMillis());
    expect(decodedId).toBe(id);
  });

  it.each([
    'not-json',
    Buffer.from(JSON.stringify({ v: 2 })).toString('base64url'),
    Buffer.from(JSON.stringify({ v: 1, id: 'short', createdAt: 123 })).toString(
      'base64url',
    ),
  ])('rejects malformed cursor input', (cursor) => {
    expect(() => decodeOrderCursor(cursor)).toThrow(BadRequestException);
  });
});
