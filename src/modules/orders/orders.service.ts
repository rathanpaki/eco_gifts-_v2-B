import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { mapOrder } from './order.mapper';
import { mapOrderEvent } from './order-event.mapper';
import { mapOrderSummary } from './order-summary.mapper';
import type { OrderListQueryDto } from './dto/order-list-query.dto';
import type { Order, OrderHistoryPage } from './order.types';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(private readonly orders: OrdersRepository) {}

  async get(userId: string, orderId: string): Promise<Order> {
    const stored = await this.orders.get(orderId);
    if (!stored || stored.data.userId !== userId) {
      throw new NotFoundException('Order not found.');
    }
    const events = await this.orders.events(stored.id);
    return {
      ...mapOrder(stored.id, stored.data),
      history: events.map((event) => {
        const mapped = mapOrderEvent(event.id, event.data);
        return {
          id: mapped.id,
          status: mapped.status,
          createdAt: mapped.createdAt,
        };
      }),
    };
  }

  async confirmDelivery(
    user: AuthenticatedUser,
    orderId: string,
  ): Promise<Order> {
    await this.orders.confirmDelivery(orderId, user);
    return this.get(user.uid, orderId);
  }

  async list(
    userId: string,
    query: OrderListQueryDto,
  ): Promise<OrderHistoryPage> {
    const page = await this.orders.list(userId, query.limit, query.cursor);
    return {
      items: page.docs.map((order) => mapOrderSummary(order.id, order.data)),
      nextCursor: page.nextCursor,
    };
  }
}
