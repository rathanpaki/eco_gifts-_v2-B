import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { AdminInventoryService } from './admin-inventory.service';
import type { InventoryEvent } from './admin-inventory.types';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';
import { InventoryHistoryQueryDto } from './dto/inventory-history-query.dto';
import { InventoryParamsDto } from './dto/inventory-params.dto';

@Controller('admin/inventory')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminInventoryController {
  constructor(private readonly inventory: AdminInventoryService) {}

  @Get(':productId/history')
  history(
    @Param() params: InventoryParamsDto,
    @Query() query: InventoryHistoryQueryDto,
  ): Promise<InventoryEvent[]> {
    return this.inventory.history(params.productId, query.limit);
  }

  @Post(':productId/adjustments')
  @UseGuards(CsrfGuard)
  adjust(
    @Param() params: InventoryParamsDto,
    @Body() body: InventoryAdjustmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InventoryEvent> {
    return this.inventory.adjust(params.productId, body, actor);
  }
}
