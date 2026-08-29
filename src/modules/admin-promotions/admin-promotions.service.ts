import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mapPromotion } from './admin-promotion.mapper';
import type {
  AdminPromotion,
  AdminPromotionPage,
  PromotionWrite,
  PublicPromotion,
} from './admin-promotion.types';
import { AdminPromotionsRepository } from './admin-promotions.repository';

@Injectable()
export class AdminPromotionsService {
  constructor(private readonly promotions: AdminPromotionsRepository) {}

  async list(): Promise<AdminPromotionPage> {
    const snapshot = await this.promotions.list();
    const items = snapshot.docs.map((document) =>
      mapPromotion(document.id, document.data()),
    );
    const percentage = items.filter(
      (item) => item.discountType === 'percentage',
    );
    return {
      items,
      metrics: {
        activeCount: items.filter((item) => item.status === 'active').length,
        attributedRevenueCents: items.reduce(
          (sum, item) => sum + item.attributedRevenueCents,
          0,
        ),
        averageDiscountPercent: percentage.length
          ? percentage.reduce((sum, item) => sum + item.discountValue, 0) /
            percentage.length
          : 0,
      },
    };
  }

  async active(): Promise<PublicPromotion[]> {
    const page = await this.list();
    return page.items
      .filter((item) => item.status === 'active')
      .map(publicPromotion);
  }

  async findActiveByCode(code: string): Promise<AdminPromotion> {
    const snapshot = await this.promotions.findByCode(code);
    if (!snapshot?.exists)
      throw new BadRequestException(
        'Promotion code is invalid or unavailable.',
      );
    const promotion = mapPromotion(snapshot.id, snapshot.data() ?? {});
    if (promotion.status !== 'active')
      throw new BadRequestException(
        'Promotion code is invalid or unavailable.',
      );
    return promotion;
  }

  async create(values: PromotionWrite): Promise<AdminPromotion> {
    validatePromotion(values);
    const snapshot = await this.promotions.create(normalize(values));
    return mapPromotion(snapshot.id, snapshot.data() ?? {});
  }

  async get(id: string): Promise<AdminPromotion> {
    const snapshot = await this.promotions.get(id);
    if (!snapshot.exists) throw new NotFoundException('Promotion not found.');
    return mapPromotion(snapshot.id, snapshot.data() ?? {});
  }

  async update(
    id: string,
    values: PromotionWrite,
  ): Promise<AdminPromotion> {
    validatePromotion(values);
    const snapshot = await this.promotions.update(id, normalize(values));
    if (!snapshot) throw new NotFoundException('Promotion not found.');
    return mapPromotion(snapshot.id, snapshot.data() ?? {});
  }

  async remove(id: string): Promise<void> {
    const removed = await this.promotions.remove(id);
    if (!removed) throw new NotFoundException('Promotion not found.');
  }
}

function normalize(values: PromotionWrite): PromotionWrite {
  return {
    ...values,
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    eligibleIds: values.eligibleIds.map((item) => item.trim()).filter(Boolean),
  };
}

function publicPromotion(item: AdminPromotion): PublicPromotion {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    discountType: item.discountType,
    discountValue: item.discountValue,
    minimumBasketCents: item.minimumBasketCents,
    endsAt: item.endsAt,
  };
}
function validatePromotion(values: PromotionWrite) {
  const start = new Date(values.startsAt).getTime();
  const end = new Date(values.endsAt).getTime();
  if (end <= start)
    throw new BadRequestException('Promotion end must be after its start.');
  if (
    values.status === 'scheduled' &&
    values.discountType === 'percentage' &&
    values.discountValue > 15
  )
    throw new BadRequestException(
      'Discounts above 15% must remain a draft until finance approves them.',
    );
  if (values.appliesTo !== 'all' && values.eligibleIds.length === 0)
    throw new BadRequestException('Choose at least one eligible item.');
}
