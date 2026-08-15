export interface SalesVelocity {
  unitsSoldPerDay: number;
  periodDays: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  velocityScore: number;
}

export interface ReorderRecommendation {
  recommendedOrderQuantity: number;
  reorderThreshold: number;
  urgency: 'critical' | 'moderate' | 'low' | 'none';
  leadTimeDays: number;
  estimatedStockoutDays: number | null;
}

export interface WasteReductionIndex {
  wasteRiskScore: number;
  wasteRiskTag: 'high_risk' | 'moderate_risk' | 'low_risk' | 'optimal';
  overstockQuantity: number;
  potentialSpoilageDays: number | null;
  shelfLifeDays: number | null;
}

export interface StockAnalytics {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  allocatedStock: number;
  availableStock: number;
  unitCostCents: number | null;
  salesVelocity: SalesVelocity;
  reorder: ReorderRecommendation;
  wasteIndex: WasteReductionIndex;
  lastRestockedAt: string | null;
}

export interface CategorySurge {
  category: string;
  surgeMultiplier: number;
  description: string;
}

export interface SeasonalDemandForecast {
  seasonName: string;
  multiplier: number;
  peakStart: string;
  peakEnd: string;
  projectedDemandUnits: number;
  recommendedStockBuffer: number;
  categorySurges: CategorySurge[];
}

export interface InventoryAnalyticsReport {
  generatedAt: string;
  totalProducts: number;
  criticalStockCount: number;
  overstockCount: number;
  items: StockAnalytics[];
  forecast: SeasonalDemandForecast;
}
