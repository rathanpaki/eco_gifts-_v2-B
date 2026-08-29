import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { mapAdminImpact } from './admin-impact.mapper';
import { AdminImpactRepository } from './admin-impact.repository';
import type {
  AdminImpactItem,
  AdminImpactPage,
  AdminImpactQuery,
  AdminImpactTrendPoint,
  VerifyImpactInput,
} from './admin-impact.types';

@Injectable()
export class AdminImpactService {
  constructor(private readonly repository: AdminImpactRepository) {}

  async list(query: AdminImpactQuery): Promise<AdminImpactPage> {
    const all = (await this.repository.documents()).map(mapAdminImpact);
    const items = all
      .filter((item) => matches(item, query))
      .slice(0, query.limit);
    return {
      items,
      metrics: {
        total: all.length,
        pending: all.filter((item) => item.status === 'pending_verification')
          .length,
        verified: all.filter((item) => item.status === 'verified').length,
        totalAmountCents: all.reduce((sum, item) => sum + item.amountCents, 0),
        treeCount: all.filter((item) => item.treeId).length,
      },
      trend: buildTrend(all),
    };
  }

  async get(id: string): Promise<AdminImpactItem> {
    const document = await this.repository.document(id);
    if (!document) throw new NotFoundException('Eco-contribution not found.');
    return mapAdminImpact(document);
  }

  async verify(
    id: string,
    input: VerifyImpactInput,
    actor: AuthenticatedUser,
  ): Promise<AdminImpactItem> {
    await this.repository.verify(id, input, actor);
    return this.get(id);
  }
}

function matches(item: AdminImpactItem, query: AdminImpactQuery): boolean {
  if (query.status !== 'all' && item.status !== query.status) return false;
  if (query.cause !== 'all' && item.cause !== query.cause) return false;
  const search = query.search?.trim().toLowerCase();
  if (!search) return true;
  return [
    item.customerName,
    item.customerEmail,
    item.userId,
    item.orderId,
    item.treeId,
  ].some((value) => value?.toLowerCase().includes(search));
}

function buildTrend(items: AdminImpactItem[]): AdminImpactTrendPoint[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6 + offset, 1),
    );
    const month = date.toISOString().slice(0, 7);
    const matching = items.filter((item) => item.createdAt.startsWith(month));
    return {
      month,
      label: date.toLocaleDateString('en', { month: 'short', timeZone: 'UTC' }),
      amountCents: matching.reduce((sum, item) => sum + item.amountCents, 0),
      contributionCount: matching.length,
    };
  });
}
