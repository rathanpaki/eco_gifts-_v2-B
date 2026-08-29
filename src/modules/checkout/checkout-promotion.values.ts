import { BadRequestException } from '@nestjs/common';
import type {
  AdminPromotion,
  PromotionDiscount,
} from '../admin-promotions/admin-promotion.types';
import type { Cart } from '../cart/cart.types';
import type { DeliveryOption } from './checkout.types';

export function checkoutPromotionDiscount(
  cart: Cart,
  delivery: DeliveryOption,
  promotion: AdminPromotion | null,
): PromotionDiscount | null {
  if (!promotion) return null;
  if (promotion.status !== 'active') invalid();
  const basketCents = cart.subtotalCents + cart.personalizationCents;
  if (basketCents < promotion.minimumBasketCents) {
    throw new BadRequestException(
      `Spend at least ${promotion.minimumBasketCents} cents to use this promotion.`,
    );
  }
  const eligibleCents = eligibleSubtotal(cart, promotion);
  if (promotion.discountType !== 'free_delivery' && eligibleCents <= 0) {
    throw new BadRequestException(
      'This promotion does not apply to the products in your bag.',
    );
  }
  const amountCents =
    promotion.discountType === 'percentage'
      ? Math.floor((eligibleCents * promotion.discountValue) / 100)
      : promotion.discountType === 'fixed'
        ? Math.min(promotion.discountValue, eligibleCents)
        : delivery.priceCents;
  return {
    id: promotion.id,
    code: promotion.code,
    name: promotion.name,
    discountType: promotion.discountType,
    amountCents,
  };
}

function eligibleSubtotal(cart: Cart, promotion: AdminPromotion): number {
  if (promotion.appliesTo === 'all')
    return cart.subtotalCents + cart.personalizationCents;
  const eligible = new Set(
    promotion.eligibleIds.map((item) => item.trim().toLowerCase()),
  );
  return cart.items.reduce((sum, item) => {
    const key =
      promotion.appliesTo === 'products'
        ? item.productId
        : item.category.toLowerCase();
    return eligible.has(key.toLowerCase()) ? sum + item.lineTotalCents : sum;
  }, 0);
}
function invalid(): never {
  throw new BadRequestException('Promotion code is invalid or unavailable.');
}
