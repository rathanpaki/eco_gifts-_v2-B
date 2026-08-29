import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { Timestamp } from 'firebase-admin/firestore';
import { calculateWeddingSeasonDemandSurge } from './inventory-calculator';
import { mapStockAnalytics } from './inventory-analytics.mapper';
import { aggregateInventorySales } from './inventory-sales.values';
import type {
  CategorySurge,
  InventoryAnalyticsReport,
  SeasonalDemandForecast,
  StockAnalytics,
} from './inventory-analytics.types';

@Injectable()
export class InventoryAnalyticsService {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async getInventoryAnalytics(): Promise<InventoryAnalyticsReport> {
    const now = Timestamp.now();
    const start = Timestamp.fromMillis(now.toMillis() - 60 * 86_400_000);
    const [products, events] = await Promise.all([
      this.firebase.firestore.collection('products').get(),
      this.firebase.firestore
        .collection('inventoryEvents')
        .where('createdAt', '>=', start)
        .get(),
    ]);
    const sales = aggregateInventorySales(
      events.docs.map((document) => document.data()),
      now.toDate(),
    );
    const items = products.docs.map((document) =>
      mapStockAnalytics(document.id, document.data(), sales.get(document.id)),
    );
    return {
      generatedAt: now.toDate().toISOString(),
      totalProducts: items.length,
      criticalStockCount: items.filter(
        (item) => item.reorder.urgency === 'critical',
      ).length,
      overstockCount: items.filter(
        (item) => item.wasteIndex.wasteRiskTag === 'high_risk',
      ).length,
      items,
      forecast: this.getSeasonalWeddingDemandForecast(items),
    };
  }

  getSeasonalWeddingDemandForecast(
    items: StockAnalytics[],
    month = new Date().getMonth() + 1,
  ): SeasonalDemandForecast {
    const demandByCategory = new Map<string, number>();
    items.forEach((item) => {
      const monthlyDemand = item.salesVelocity.unitsSoldPerDay * 30;
      demandByCategory.set(
        item.category,
        (demandByCategory.get(item.category) ?? 0) + monthlyDemand,
      );
    });
    const categorySurges = [...demandByCategory].map(([category, demand]) =>
      categoryForecast(category, demand, month),
    );
    const baseDemand = [...demandByCategory.values()].reduce(
      (sum, demand) => sum + demand,
      0,
    );
    const projectedDemandUnits = categorySurges.reduce(
      (sum, item) => sum + item.projectedDemand,
      0,
    );
    return {
      seasonName: 'Wedding & Celebration Season',
      multiplier:
        baseDemand > 0
          ? Number((projectedDemandUnits / baseDemand).toFixed(2))
          : 1,
      peakStart: 'Oct 15',
      peakEnd: 'Feb 28',
      projectedDemandUnits,
      recommendedStockBuffer: categorySurges.reduce(
        (sum, item) => sum + item.buffer,
        0,
      ),
      categorySurges: categorySurges.map((item) => ({
        category: item.category,
        surgeMultiplier: item.surgeMultiplier,
        description: item.description,
      })),
    };
  }
}

type ForecastCategory = CategorySurge & {
  projectedDemand: number;
  buffer: number;
};

function categoryForecast(
  category: string,
  demand: number,
  month: number,
): ForecastCategory {
  const forecast = calculateWeddingSeasonDemandSurge(demand, month, category);
  return {
    category,
    surgeMultiplier: forecast.surgeMultiplier,
    description:
      forecast.surgeMultiplier > 1
        ? 'Seasonal demand is above the current 30-day baseline.'
        : 'No seasonal uplift is currently applied.',
    projectedDemand: forecast.forecastedDemand,
    buffer: forecast.bufferNeeded,
  };
}
