import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { mapOrder } from '../orders/order.mapper';
import type {
  AdminCustomer,
  AdminCustomerPage,
  CustomerContact,
  CustomerNote,
} from './admin-customer.types';
import {
  count,
  finite,
  mapCustomerNote,
  mapCustomerSummary,
  nullableTimestamp,
} from './admin-customer.mapper';
import { AdminCustomersRepository } from './admin-customers.repository';
import { CustomerMetricsRepository } from './customer-metrics.repository';
import { customerOrderStats } from './customer-order-stats';
import { CustomerPrivacyRepository } from './customer-privacy.repository';
import type { CreateCustomerNoteDto } from './dto/create-customer-note.dto';
import type { CustomerListQueryDto } from './dto/customer-list-query.dto';

@Injectable()
export class AdminCustomersService {
  constructor(
    private readonly repository: AdminCustomersRepository,
    private readonly metrics: CustomerMetricsRepository,
    private readonly privacy: CustomerPrivacyRepository,
  ) {}

  async list(query: CustomerListQueryDto): Promise<AdminCustomerPage> {
    const owner = isOrderNumber(query.search)
      ? await this.repository.orderOwner(query.search as string)
      : undefined;
    const [page, metrics] = await Promise.all([
      this.repository.list(query, owner ?? undefined),
      this.metrics.get(),
    ]);
    return {
      items: page.docs.map((customer) =>
        mapCustomerSummary(customer.id, customer.data),
      ),
      metrics,
      nextCursor: page.nextCursor,
    };
  }

  async get(customerId: string): Promise<AdminCustomer> {
    const profile = await this.repository.profile(customerId);
    if (!profile) throw new NotFoundException('Customer not found.');
    const [auth, orders, notes] = await Promise.all([
      this.repository.authUser(customerId),
      this.repository.orders(customerId),
      this.repository.notes(customerId),
    ]);
    const mappedOrders = orders.map((order) => mapOrder(order.id, order.data));
    const summary = mapCustomerSummary(profile.id, profile.data);
    const stats = customerOrderStats(mappedOrders);
    return {
      ...summary,
      ...stats,
      displayName: auth.displayName?.trim() || summary.displayName,
      email: auth.email ?? summary.email,
      emailVerified: auth.emailVerified,
      disabled: auth.disabled,
      rewardPoints: count(profile.data.rewardPoints),
      impactCo2SavedKg: finite(stats.impactCo2SavedKg),
      marketingConsentUpdatedAt: nullableTimestamp(
        profile.data.marketingConsentUpdatedAt,
      ),
      contact: contact(mappedOrders[0]),
      recentOrders: orders.slice(0, 8).map((order) => order.summary),
      notes: notes.map((note) => mapCustomerNote(note.id, note.data)),
    };
  }

  async addNote(
    customerId: string,
    input: CreateCustomerNoteDto,
    actor: AuthenticatedUser,
  ): Promise<CustomerNote> {
    await this.get(customerId);
    const note = await this.repository.addNote(customerId, input.body, actor);
    return mapCustomerNote(note.id, note.data() ?? {});
  }

  async export(customerId: string) {
    const [customer, collections] = await Promise.all([
      this.get(customerId),
      this.privacy.exportCollections(customerId),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      customer: {
        ...customer,
        notes: customer.notes.map(({ id, body, createdAt }) => ({
          id,
          body,
          createdAt,
        })),
      },
      records: collections,
    };
  }
}

function isOrderNumber(value?: string): boolean {
  return Boolean(value && /^EG-[A-Z0-9-]+$/i.test(value.trim()));
}

function contact(order?: ReturnType<typeof mapOrder>): CustomerContact {
  if (!order) return { phone: null, address: null };
  const value = order.address;
  return {
    phone: value.phone ?? null,
    address: [
      value.addressLine1,
      value.addressLine2,
      value.city,
      value.region,
      value.postalCode,
      value.countryCode,
    ]
      .filter(Boolean)
      .join(', '),
  };
}
