import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { OrderParamsDto } from './dto/order-params.dto';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import type { Order, OrderHistoryPage } from './order.types';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(SessionAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrderListQueryDto,
  ): Promise<OrderHistoryPage> {
    return this.orders.list(user.uid, query);
  }

  @Post(':orderId/delivery-confirmation')
  @UseGuards(CsrfGuard)
  confirmDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: OrderParamsDto,
  ): Promise<Order> {
    return this.orders.confirmDelivery(user, params.orderId);
  }

  @Get(':orderId')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: OrderParamsDto,
  ): Promise<Order> {
    return this.orders.get(user.uid, params.orderId);
  }
}
