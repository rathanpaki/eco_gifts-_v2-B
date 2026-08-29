import { BadRequestException } from '@nestjs/common';

export function adjustedStock(before: unknown, delta: number): number {
  if (!Number.isSafeInteger(before) || (before as number) < 0) {
    throw new BadRequestException('Stored product stock is invalid.');
  }
  const after = (before as number) + delta;
  if (!Number.isSafeInteger(after) || after < 0) {
    throw new BadRequestException('The adjustment cannot make stock negative.');
  }
  return after;
}

export function lowStockThreshold(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}
