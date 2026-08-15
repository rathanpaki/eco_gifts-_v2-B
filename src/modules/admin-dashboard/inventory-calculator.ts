import type {
  SalesVelocity,
  ReorderRecommendation,
  WasteReductionIndex,
} from './inventory-analytics.types';

export function calculateSalesVelocity(
  unitsSold: number,
  periodDays: number = 30,
  previousPeriodSold: number = 0,
): SalesVelocity {
  const unitsSoldPerDay =
    periodDays > 0 ? Math.round((unitsSold / periodDays) * 100) / 100 : 0;
  let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (previousPeriodSold > 0) {
    if (unitsSold > previousPeriodSold * 1.1) trend = 'increasing';
    else if (unitsSold < previousPeriodSold * 0.9) trend = 'decreasing';
  }
  const velocityScore = Math.min(100, Math.round(unitsSoldPerDay * 15));
  return { unitsSoldPerDay, periodDays, trend, velocityScore };
}

export function calculateOptimalReorder(
  currentStock: number,
  dailyVelocity: number,
  leadTimeDays: number = 7,
  safetyBufferDays: number = 5,
): ReorderRecommendation {
  const reorderThreshold = Math.ceil(
    dailyVelocity * (leadTimeDays + safetyBufferDays),
  );
  const targetStock = Math.ceil(dailyVelocity * (leadTimeDays * 3));
  const recommendedOrderQuantity = Math.max(0, targetStock - currentStock);
  const estimatedStockoutDays =
    dailyVelocity > 0
      ? Math.max(0, Math.floor(currentStock / dailyVelocity))
      : null;

  let urgency: 'critical' | 'moderate' | 'low' | 'none' = 'none';
  if (
    currentStock <= 0 ||
    (estimatedStockoutDays !== null &&
      estimatedStockoutDays <= Math.ceil(leadTimeDays / 2))
  ) {
    urgency = 'critical';
  } else if (currentStock <= reorderThreshold) {
    urgency = 'moderate';
  } else if (currentStock <= reorderThreshold * 1.25) {
    urgency = 'low';
  }

  return {
    recommendedOrderQuantity,
    reorderThreshold,
    urgency,
    leadTimeDays,
    estimatedStockoutDays,
  };
}

export function calculateWeddingSeasonDemandSurge(
  baseDemand: number,
  currentMonth: number = new Date().getMonth() + 1,
  category: string = 'General',
): { surgeMultiplier: number; forecastedDemand: number; bufferNeeded: number } {
  const isWeddingPeak = [10, 11, 12, 1, 2].includes(currentMonth);
  const isWeddingCategory = /wedding|favor|gift box|hampers|custom/i.test(
    category,
  );

  let surgeMultiplier = 1.0;
  if (isWeddingPeak) {
    surgeMultiplier = isWeddingCategory ? 2.3 : 1.6;
  } else if ([4, 5, 6].includes(currentMonth)) {
    surgeMultiplier = isWeddingCategory ? 1.4 : 1.2;
  }

  const forecastedDemand = Math.ceil(baseDemand * surgeMultiplier);
  const bufferNeeded = Math.ceil(forecastedDemand * 0.25);
  return { surgeMultiplier, forecastedDemand, bufferNeeded };
}

export function calculateWasteMinimizationIndex(
  currentStock: number,
  dailyVelocity: number,
  shelfLifeDays: number | null = null,
): WasteReductionIndex {
  const daysToClear =
    dailyVelocity > 0 ? Math.ceil(currentStock / dailyVelocity) : 999;
  let overstockQuantity = 0;
  let wasteRiskScore = 0;

  if (shelfLifeDays && shelfLifeDays > 0) {
    if (daysToClear > shelfLifeDays) {
      overstockQuantity = Math.max(
        0,
        currentStock - Math.floor(dailyVelocity * shelfLifeDays),
      );
      wasteRiskScore = Math.min(
        100,
        Math.round((daysToClear / shelfLifeDays) * 60),
      );
    }
  } else {
    if (daysToClear > 90) {
      overstockQuantity = Math.max(
        0,
        currentStock - Math.ceil(dailyVelocity * 90),
      );
      wasteRiskScore = Math.min(100, Math.round((daysToClear / 180) * 100));
    }
  }

  let wasteRiskTag: 'high_risk' | 'moderate_risk' | 'low_risk' | 'optimal' =
    'optimal';
  if (wasteRiskScore >= 70) wasteRiskTag = 'high_risk';
  else if (wasteRiskScore >= 40) wasteRiskTag = 'moderate_risk';
  else if (wasteRiskScore >= 20) wasteRiskTag = 'low_risk';

  return {
    wasteRiskScore,
    wasteRiskTag,
    overstockQuantity,
    potentialSpoilageDays: shelfLifeDays
      ? Math.max(0, daysToClear - shelfLifeDays)
      : null,
    shelfLifeDays,
  };
}
