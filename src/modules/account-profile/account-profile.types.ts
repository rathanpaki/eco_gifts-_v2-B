import type { PublicProduct } from '../products/product.types';
export interface AccountAddress {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  country: string;
  countryCode: string;
  phone: string | null;
  primary: boolean;
}

export interface AccountProfile {
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  avatarUrl: string | null;
  addresses: AccountAddress[];
}

export interface AddressValues {
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone: string;
  primary: boolean;
}

export const occasionPreferenceValues = [
  'birthdays',
  'weddings',
  'new-baby',
  'thank-you',
  'corporate',
] as const;
export const packagingPreferenceValues = [
  'recycled-sage',
  'natural-kraft',
  'fabric-wrap',
] as const;
export const cardStyleValues = [
  'elegant',
  'classic',
  'modern',
  'script',
] as const;

export interface GiftPreferences {
  occasions: string[];
  packaging: string;
  cardStyle: string;
  avoidPlasticExtras: boolean;
  occasionReminders: boolean;
  newCollectionUpdates: boolean;
  impactMilestones: boolean;
}

export const defaultGiftPreferences: GiftPreferences = {
  occasions: ['birthdays', 'weddings'],
  packaging: 'recycled-sage',
  cardStyle: 'elegant',
  avoidPlasticExtras: true,
  occasionReminders: true,
  newCollectionUpdates: false,
  impactMilestones: true,
};
export interface WishlistCustomization {
  id: string;
  previewPath: string;
}
export type WishlistProduct = PublicProduct & {
  savedCustomization: WishlistCustomization | null;
};
