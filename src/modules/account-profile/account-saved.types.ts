export interface GiftProfile {
  id: string;
  recipientName: string;
  relationship: string;
  occasion: string;
  importantDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GiftProfileValues {
  recipientName: string;
  relationship: string;
  occasion: string;
  importantDate?: string;
  notes?: string;
}

export type CardBrand = 'visa' | 'mastercard' | 'card';

export interface SavedPaymentMethod {
  id: string;
  cardholderName: string;
  brand: CardBrand;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  primary: boolean;
  createdAt: string;
}

export interface PaymentMethodValues {
  cardholderName: string;
  brand: CardBrand;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  primary: boolean;
}
