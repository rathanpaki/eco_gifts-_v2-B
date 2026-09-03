import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { ProductReview } from './product-review.types';

export function mapProductReview(
  id: string,
  data: DocumentData,
): ProductReview {
  return {
    id,
    productId: text(data.productId),
    orderId: text(data.orderId),
    rating: rating(data.rating),
    title: optionalText(data.title),
    comment: text(data.comment),
    displayName: text(data.displayName),
    verifiedPurchase: true,
    createdAt: date(data.createdAt),
  };
}

function text(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new InternalServerErrorException('Stored review data is invalid.');
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function rating(value: unknown): number {
  if (Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5) {
    return Number(value);
  }
  throw new InternalServerErrorException('Stored review data is invalid.');
}

function date(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  throw new InternalServerErrorException('Stored review data is invalid.');
}
