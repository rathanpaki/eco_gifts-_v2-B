import {
  calculateOptimalReorder,
  calculateSalesVelocity,
  calculateWasteMinimizationIndex,
  calculateWeddingSeasonDemandSurge,
} from './inventory-calculator';

describe('inventory calculator', () => {
  it('derives velocity and trend from persisted sales totals', () => {
    expect(calculateSalesVelocity(60, 30, 40)).toEqual({
      unitsSoldPerDay: 2,
      periodDays: 30,
      trend: 'increasing',
      velocityScore: 30,
    });
  });

  it('marks inventory below lead-time demand as critical', () => {
    expect(calculateOptimalReorder(3, 1, 7)).toMatchObject({
      urgency: 'critical',
      estimatedStockoutDays: 3,
      reorderThreshold: 12,
    });
  });

  it('reports stock that cannot clear before shelf life', () => {
    expect(calculateWasteMinimizationIndex(100, 2, 30)).toMatchObject({
      overstockQuantity: 40,
      potentialSpoilageDays: 20,
    });
  });

  it('uses deterministic wedding-season policy inputs', () => {
    expect(
      calculateWeddingSeasonDemandSurge(100, 11, 'Wedding favors'),
    ).toEqual({
      surgeMultiplier: 2.3,
      forecastedDemand: 230,
      bufferNeeded: 58,
    });
  });
});
