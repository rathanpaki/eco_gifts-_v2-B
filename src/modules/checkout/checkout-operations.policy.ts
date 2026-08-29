import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { AdminSettings } from '../admin-settings/admin-settings.types';
import type { DeliveryAddress } from '../orders/order.types';
import type { DeliveryOption } from './checkout.types';

export type CheckoutOperations = Pick<
  AdminSettings,
  | 'storefrontActive'
  | 'handlingDays'
  | 'carbonNeutralDelivery'
  | 'requireAddressValidation'
>;

export function assertStorefrontActive(settings: CheckoutOperations): void {
  if (!settings.storefrontActive) {
    throw new ServiceUnavailableException(
      'The storefront is temporarily not accepting orders.',
    );
  }
}

export function assertConfiguredAddress(
  address: DeliveryAddress,
  settings: CheckoutOperations,
): void {
  const requiresRegion = ['US', 'CA', 'AU'].includes(address.countryCode);
  if (settings.requireAddressValidation && requiresRegion && !address.region) {
    throw new BadRequestException(
      'State or region is required for this delivery address.',
    );
  }
}

export function configuredDeliveryOptions(
  options: DeliveryOption[],
  settings?: CheckoutOperations,
): DeliveryOption[] {
  if (!settings) return options.map((option) => ({ ...option }));
  return options.map((option) => {
    const transit = option.id === 'express' ? [1, 2] : [3, 5];
    const [minimum, maximum] = transit.map(
      (days) => days + settings.handlingDays,
    );
    return {
      ...option,
      estimatedDays: `${minimum}-${maximum} business days`,
    };
  });
}
