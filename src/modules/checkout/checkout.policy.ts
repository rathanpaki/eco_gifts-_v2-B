import { BadRequestException } from '@nestjs/common';
import type { AdminPromotion } from '../admin-promotions/admin-promotion.types';
import type { Cart } from '../cart/cart.types';
import { contributionSummary } from '../eco-contribution/contribution.values';
import type { RewardDiscount } from '../eco-contribution/contribution.types';
import { checkoutPromotionDiscount } from './checkout-promotion.values';
import {
  configuredDeliveryOptions,
  type CheckoutOperations,
} from './checkout-operations.policy';
import type {
  CheckoutImpact,
  CheckoutQuote,
  CheckoutSelection,
  DeliveryOption,
  PackagingOption,
} from './checkout.types';

const PACKAGING: PackagingOption[] = [
  {
    id: 'recycled-box',
    name: 'Recycled Box',
    description: '100% post-consumer recycled cardboard packaging',
    priceCents: 0,
    co2SavingsKg: 0.45,
    plasticAvoidedGrams: 30,
    ecoBonusPoints: 10,
  },
  {
    id: 'seed-paper-wrap',
    name: 'Seed Paper Wrap',
    description: 'Plantable wrap embedded with wildflower seeds',
    priceCents: 150,
    co2SavingsKg: 0.65,
    plasticAvoidedGrams: 45,
    ecoBonusPoints: 15,
  },
  {
    id: 'zero-waste-cloth',
    name: 'Zero-Waste Cloth',
    description: 'Reusable organic cotton wrapping cloth',
    priceCents: 300,
    co2SavingsKg: 0.85,
    plasticAvoidedGrams: 60,
    ecoBonusPoints: 20,
  },
];
const DELIVERY: DeliveryOption[] = [
  {
    id: 'standard',
    name: 'Standard delivery',
    description: 'Tracked delivery with the lowest transport impact',
    priceCents: 0,
    co2OffsetKg: 0,
    ecoBonusPoints: 0,
    estimatedDays: '3-5 business days',
  },
  {
    id: 'express',
    name: 'Express delivery',
    description: 'Faster tracked delivery with higher transport impact',
    priceCents: 1200,
    co2OffsetKg: 0,
    ecoBonusPoints: 0,
    estimatedDays: '1-2 business days',
  },
  {
    id: 'green-logistics',
    name: 'Carbon-Neutral Green Delivery',
    description: 'EV-supported transport with certified carbon offset',
    priceCents: 250,
    co2OffsetKg: 1.2,
    ecoBonusPoints: 15,
    estimatedDays: '3-5 business days',
  },
];

export function buildCheckoutQuote(
  cart: Cart,
  selection: CheckoutSelection,
  discount: RewardDiscount | null = null,
  promotion: AdminPromotion | null = null,
  operations?: CheckoutOperations,
): CheckoutQuote {
  if (!cart.readyForCheckout || !cart.currency || !cart.items.length)
    throw new BadRequestException('The cart is not ready for checkout.');
  if (cart.currency !== 'USD')
    throw new BadRequestException('Checkout currently requires USD products.');
  if (selection.voucherId && selection.promoCode)
    throw new BadRequestException(
      'Choose either a reward voucher or a promotion code.',
    );
  const packaging = select(PACKAGING, selection.packagingId, 'recycled-box');
  const deliveryOptions = configuredDeliveryOptions(DELIVERY, operations);
  const delivery = select(
    deliveryOptions,
    selection.deliveryId,
    operations?.carbonNeutralDelivery ? 'green-logistics' : 'standard',
  );
  const ecoContribution = contributionSummary(
    selection.contributionCause,
    selection.contributionAmountCents,
  );
  const grossTotalCents =
    cart.subtotalCents +
    cart.personalizationCents +
    packaging.priceCents +
    delivery.priceCents +
    (ecoContribution?.amountCents ?? 0);
  const rewardDiscount = discount
    ? {
        ...discount,
        amountCents: Math.min(discount.amountCents, grossTotalCents),
      }
    : null;
  const promotionDiscount = checkoutPromotionDiscount(
    cart,
    delivery,
    promotion,
  );
  const discountCents =
    (rewardDiscount?.amountCents ?? 0) + (promotionDiscount?.amountCents ?? 0);
  return {
    items: cart.items,
    packagingOptions: PACKAGING.map((option) => ({ ...option })),
    deliveryOptions,
    packaging,
    delivery,
    subtotalCents: cart.subtotalCents,
    personalizationCents: cart.personalizationCents,
    totalCents: Math.max(0, grossTotalCents - discountCents),
    currency: cart.currency,
    impact: impact(cart, packaging, delivery),
    ecoContribution,
    rewardDiscount,
    promotionDiscount,
    paymentMethod: 'pay_on_delivery',
  };
}
function impact(
  cart: Cart,
  packaging: PackagingOption,
  delivery: DeliveryOption,
): CheckoutImpact {
  const quantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const productScore = quantity
    ? cart.items.reduce((sum, item) => sum + item.ecoScore * item.quantity, 0) /
      quantity
    : 0;
  const score = Math.min(
    100,
    Math.round(
      productScore + packaging.ecoBonusPoints / 2 + delivery.ecoBonusPoints / 2,
    ),
  );
  return {
    score,
    grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 65 ? 'B' : 'C',
    co2SavedKg: Number(
      (packaging.co2SavingsKg + delivery.co2OffsetKg).toFixed(2),
    ),
    plasticAvoidedGrams: packaging.plasticAvoidedGrams,
    methodologyVersion: '2026.1',
    estimated: true,
  };
}
function select<T extends { id: string }>(
  options: T[],
  id: string | undefined,
  fallback: string,
): T {
  const selected = options.find((option) => option.id === (id ?? fallback));
  if (!selected) throw new BadRequestException('Invalid checkout option.');
  return { ...selected };
}
