import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { Order, PaymentMethod } from './order.types';
import { mapDeliveryConfirmation } from './order-delivery.mapper';
import {
  mapOrderContribution,
  mapOrderRewardDiscount,
  mapOrderPromotionDiscount,
} from './order-eco.mapper';

export function mapOrder(id: string, data: DocumentData): Order {
  const items = array(data.items).map((item) => {
    const value = record(item);
    return {
      itemId: text(value.itemId),
      productId: text(value.productId),
      slug: text(value.slug),
      name: text(value.name),
      image: image(value.image),
      unitPriceCents: integer(value.unitPriceCents),
      quantity: positiveInteger(value.quantity),
      lineTotalCents: integer(value.lineTotalCents),
      ecoScore: integer(value.ecoScore),
      customization: customization(value.customization),
    };
  });
  const address = record(data.address);
  const packaging = record(data.packaging);
  const delivery = record(data.delivery);
  const impact = record(data.impact);
  const fulfillment = fulfillmentStatus(data.fulfillmentStatus);
  if (!items.length) invalid();
  return {
    id,
    orderNumber: text(data.orderNumber),
    items,
    address: {
      fullName: text(address.fullName),
      addressLine1: text(address.addressLine1),
      ...optional('addressLine2', address.addressLine2),
      city: text(address.city),
      ...optional('region', address.region),
      postalCode: text(address.postalCode),
      countryCode: text(address.countryCode),
      phone: legacyPhone(address.phone),
    },
    packaging: {
      id: packagingId(packaging.id),
      name: text(packaging.name),
      description: text(packaging.description),
      priceCents: integer(packaging.priceCents),
      co2SavingsKg: number(packaging.co2SavingsKg),
      plasticAvoidedGrams: integer(packaging.plasticAvoidedGrams),
      ecoBonusPoints: integer(packaging.ecoBonusPoints),
    },
    delivery: {
      id: deliveryId(delivery.id),
      name: text(delivery.name),
      description: text(delivery.description),
      priceCents: integer(delivery.priceCents),
      co2OffsetKg: number(delivery.co2OffsetKg),
      ecoBonusPoints: integer(delivery.ecoBonusPoints),
      estimatedDays: text(delivery.estimatedDays),
    },
    impact: {
      score: integer(impact.score),
      grade: grade(impact.grade),
      co2SavedKg: number(impact.co2SavedKg),
      plasticAvoidedGrams: integer(impact.plasticAvoidedGrams),
      methodologyVersion: text(impact.methodologyVersion),
      estimated: true,
    },
    ecoContribution: mapOrderContribution(data.ecoContribution),
    rewardDiscount: mapOrderRewardDiscount(data.rewardDiscount),
    promotionDiscount: mapOrderPromotionDiscount(data.promotionDiscount),
    subtotalCents: integer(data.subtotalCents),
    personalizationCents: optionalInteger(data.personalizationCents),
    totalCents: integer(data.totalCents),
    currency: text(data.currency),
    paymentMethod: paymentMethod(data.paymentMethod),
    paymentStatus: paymentStatus(data.paymentStatus),
    fulfillmentStatus: fulfillment,
    ...mapDeliveryConfirmation(data, fulfillment),
    history: [],
    createdAt: timestamp(data.createdAt),
  };
}

function record(value: unknown): DocumentData {
  return typeof value === 'object' && value !== null ? value : invalid();
}
function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : invalid();
}
function text(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : invalid();
}
function integer(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : invalid();
}
function optionalInteger(value: unknown): number {
  return value === undefined ? 0 : integer(value);
}
function positiveInteger(value: unknown): number {
  const parsed = integer(value);
  return parsed > 0 ? parsed : invalid();
}
function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : invalid();
}
function optional(key: string, value: unknown): Record<string, string> {
  return typeof value === 'string' && value.trim() ? { [key]: value } : {};
}
function image(value: unknown): { url: string; alt: string } | null {
  if (value === null) return null;
  const data = record(value);
  return { url: text(data.url), alt: text(data.alt) };
}
function customization(
  value: unknown,
): { id: string; previewPath: string; text: string | null } | null {
  if (value === undefined || value === null) return null;
  const data = record(value);
  const previewPath = text(data.previewPath);
  if (!/^\/api\/customizations\/[A-Za-z0-9_-]+\/preview$/.test(previewPath)) {
    return invalid();
  }
  return {
    id: text(data.id),
    previewPath,
    text:
      typeof data.text === 'string' && data.text.trim()
        ? data.text.trim().slice(0, 120)
        : null,
  };
}
function legacyPhone(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return text(value);
}
function timestamp(value: unknown): string {
  return value instanceof Timestamp ? value.toDate().toISOString() : invalid();
}
function paymentMethod(value: unknown): PaymentMethod {
  return value === 'pay_on_delivery' || value === 'demo_card'
    ? value
    : invalid();
}
function paymentStatus(value: unknown) {
  if (
    value === 'pending' ||
    value === 'paid' ||
    value === 'failed' ||
    value === 'refunded'
  )
    return value;
  return invalid();
}
function fulfillmentStatus(value: unknown) {
  if (
    value === 'pending' ||
    value === 'confirmed' ||
    value === 'processing' ||
    value === 'shipped' ||
    value === 'delivered' ||
    value === 'cancelled'
  )
    return value;
  return invalid();
}
function packagingId(value: unknown) {
  if (
    value === 'recycled-box' ||
    value === 'seed-paper-wrap' ||
    value === 'zero-waste-cloth'
  )
    return value;
  return invalid();
}
function deliveryId(value: unknown) {
  return value === 'standard' ||
    value === 'express' ||
    value === 'green-logistics'
    ? value
    : invalid();
}
function grade(value: unknown) {
  return value === 'A+' || value === 'A' || value === 'B' || value === 'C'
    ? value
    : invalid();
}
function invalid(): never {
  throw new InternalServerErrorException('Stored order data is invalid.');
}
