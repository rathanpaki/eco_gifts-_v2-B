import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { mapAdminOrder, mapAdminOrderSummary } from './admin-order.mapper';
import type {
  AdminOrder,
  AdminOrderMetrics,
  AdminOrderPage,
} from './admin-order.types';
import { AdminOrdersRepository } from './admin-orders.repository';
import type { AdminOrderListQueryDto } from './dto/admin-order-list-query.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class AdminOrdersService {
  constructor(private readonly repository: AdminOrdersRepository) {}

  async list(query: AdminOrderListQueryDto): Promise<AdminOrderPage> {
    const [page, counts] = await Promise.all([
      this.repository.list(query.filter, query.limit, query.cursor),
      this.repository.metrics(),
    ]);
    const metrics: AdminOrderMetrics = {
      total: counts.total,
      pending: counts.pending ?? 0,
      confirmed: counts.confirmed ?? 0,
      processing: counts.processing ?? 0,
      shipped: counts.shipped ?? 0,
      delivered: counts.delivered ?? 0,
      cancelled: counts.cancelled ?? 0,
    };
    return {
      items: page.docs.map((order) =>
        mapAdminOrderSummary(order.id, order.data),
      ),
      metrics,
      nextCursor: page.nextCursor,
    };
  }

  async get(orderId: string): Promise<AdminOrder> {
    const order = await this.repository.get(orderId);
    if (!order) throw new NotFoundException('Order not found.');
    const events = await this.repository.events(order.id);
    return mapAdminOrder(order.id, order.data, events);
  }

  async updateStatus(
    orderId: string,
    input: UpdateOrderStatusDto,
    actor: AuthenticatedUser,
  ): Promise<AdminOrder> {
    await this.repository.transition(
      orderId,
      input.status,
      input.note?.trim() || null,
      actor,
    );
    return this.get(orderId);
  }
}
