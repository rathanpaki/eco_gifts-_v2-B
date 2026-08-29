import { InternalServerErrorException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { mapOrder } from './order.mapper';

function storedOrder() {
  return {
    orderNumber: 'ECO-1001',
    items: [
      {
        itemId: 'item-1',
        productId: 'product-1',
        slug: 'eco-gift',
        name: 'Eco gift',
        image: null,
        unitPriceCents: 2500,
        quantity: 1,
        lineTotalCents: 2500,
        ecoScore: 90,
      },
    ],
    address: {
      fullName: 'Legacy Customer',
      addressLine1: '1 Green Street',
      city: 'Colombo',
      postalCode: '00100',
      countryCode: 'LK',
    },
    packaging: {
      id: 'recycled-box',
      name: 'Recycled box',
      description: 'Recycled packaging',
      priceCents: 0,
      co2SavingsKg: 0.4,
      plasticAvoidedGrams: 20,
      ecoBonusPoints: 5,
    },
    delivery: {
      id: 'standard',
      name: 'Standard delivery',
      description: 'Standard delivery service',
      priceCents: 500,
      co2OffsetKg: 0.2,
      ecoBonusPoints: 2,
      estimatedDays: '3–5 business days',
    },
    impact: {
      score: 90,
      grade: 'A',
      co2SavedKg: 0.6,
      plasticAvoidedGrams: 20,
      methodologyVersion: 'v1',
    },
    subtotalCents: 2500,
    totalCents: 3000,
    currency: 'USD',
    paymentMethod: 'pay_on_delivery',
    paymentStatus: 'pending',
    fulfillmentStatus: 'pending',
    createdAt: Timestamp.fromMillis(1_786_428_000_000),
  };
}

describe('mapOrder legacy compatibility', () => {
  it('maps orders created before phone and customization were stored', () => {
    const order = mapOrder('legacy-order', storedOrder());

    expect(order.address.phone).toBeNull();
    expect(order.items[0].customization).toBeNull();
  });

  it('still rejects a corrupt stored phone value', () => {
    const data = storedOrder();
    Object.assign(data.address, { phone: 12345 });

    expect(() => mapOrder('corrupt-order', data)).toThrow(
      InternalServerErrorException,
    );
  });
});
