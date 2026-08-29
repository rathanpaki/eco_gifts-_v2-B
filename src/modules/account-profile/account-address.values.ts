import type { AddressValues } from './account-profile.types';

export function addressDocument(values: AddressValues, primary: boolean) {
  return {
    label: values.label.trim(),
    fullName: values.fullName.trim(),
    line1: values.line1.trim(),
    line2: values.line2?.trim() || null,
    city: values.city.trim(),
    region: values.region?.trim() || null,
    postalCode: values.postalCode.trim(),
    country: values.country.trim(),
    countryCode: values.countryCode.trim().toUpperCase(),
    phone: values.phone.trim(),
    primary,
  };
}
