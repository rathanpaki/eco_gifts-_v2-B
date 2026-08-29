export interface AdminSettings {
  storeName: string;
  supportEmail: string;
  storefrontActive: boolean;
  newOrderAlerts: boolean;
  paymentFailureAlerts: boolean;
  lowStockDigest: boolean;
  handlingDays: number;
  carbonNeutralDelivery: boolean;
  requireAddressValidation: boolean;
  sessionTimeoutMinutes: number;
}

export const defaultAdminSettings: AdminSettings = {
  storeName: 'EcoGifts',
  supportEmail: 'hello@ecogifts.example',
  storefrontActive: true,
  newOrderAlerts: true,
  paymentFailureAlerts: true,
  lowStockDigest: false,
  handlingDays: 2,
  carbonNeutralDelivery: true,
  requireAddressValidation: true,
  sessionTimeoutMinutes: 30,
};
