import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AdminDashboardService } from './admin-dashboard.service';
import { InventoryAnalyticsService } from './inventory-analytics.service';
import type { AdminDashboard } from './admin-dashboard.types';
import type { InventoryAnalyticsReport } from './inventory-analytics.types';

@Controller('admin/dashboard')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(
    private readonly dashboard: AdminDashboardService,
    private readonly inventoryAnalytics: InventoryAnalyticsService,
  ) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser): Promise<AdminDashboard> {
    return this.dashboard.get(user);
  }

  @Get('inventory-analytics')
  getInventoryAnalytics(): Promise<InventoryAnalyticsReport> {
    return this.inventoryAnalytics.getInventoryAnalytics();
  }
}
