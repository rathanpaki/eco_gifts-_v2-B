import { BadRequestException } from '@nestjs/common';
import {
  adjustedStock,
  lowStockThreshold,
} from './inventory-adjustment.values';

describe('inventory adjustment values', () => {
  it('adds and removes stock without allowing a negative result', () => {
    expect(adjustedStock(10, 5)).toBe(15);
    expect(adjustedStock(10, -4)).toBe(6);
    expect(() => adjustedStock(2, -3)).toThrow(BadRequestException);
  });

  it('uses zero when a stored low-stock threshold is absent', () => {
    expect(lowStockThreshold(4)).toBe(4);
    expect(lowStockThreshold(undefined)).toBe(0);
  });
});
