import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { OrderParamsDto } from '../orders/dto/order-params.dto';
import type { AdminOrder, AdminOrderPage } from './admin-order.types';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrderListQueryDto } from './dto/admin-order-list-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('admin/orders')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminOrdersController {
  constructor(private readonly orders: AdminOrdersService) {}

  @Get()
  list(@Query() query: AdminOrderListQueryDto): Promise<AdminOrderPage> {
    return this.orders.list(query);
  }

  @Get(':orderId')
  get(@Param() params: OrderParamsDto): Promise<AdminOrder> {
    return this.orders.get(params.orderId);
  }

  @Patch(':orderId/status')
  @UseGuards(CsrfGuard)
  updateStatus(
    @Param() params: OrderParamsDto,
    @Body() body: UpdateOrderStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminOrder> {
    return this.orders.updateStatus(params.orderId, body, actor);
  }
}
