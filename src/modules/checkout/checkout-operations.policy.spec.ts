import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  assertConfiguredAddress,
  assertStorefrontActive,
  configuredDeliveryOptions,
  type CheckoutOperations,
} from './checkout-operations.policy';
import type { DeliveryOption } from './checkout.types';

const settings: CheckoutOperations = {
  storefrontActive: true,
  handlingDays: 2,
  carbonNeutralDelivery: true,
  requireAddressValidation: true,
};

describe('checkout operational settings', () => {
  it('blocks checkout while the storefront is paused', () => {
    expect(() =>
      assertStorefrontActive({ ...settings, storefrontActive: false }),
    ).toThrow(ServiceUnavailableException);
  });

  it('requires a region for configured country formats', () => {
    expect(() =>
      assertConfiguredAddress(
        {
          fullName: 'Sarah James',
          addressLine1: '12 Green Way',
          addressLine2: null,
          city: 'Austin',
          region: null,
          postalCode: '73301',
          countryCode: 'US',
          phone: '+15125550101',
        },
        settings,
      ),
    ).toThrow(BadRequestException);
  });

  it('adds handling time to delivery estimates', () => {
    const option: DeliveryOption = {
      id: 'standard',
      name: 'Standard',
      description: 'Tracked',
      priceCents: 0,
      co2OffsetKg: 0,
      ecoBonusPoints: 0,
      estimatedDays: '3-5 business days',
    };
    expect(configuredDeliveryOptions([option], settings)[0].estimatedDays).toBe(
      '5-7 business days',
    );
  });
});
