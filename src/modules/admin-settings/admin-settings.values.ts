import {
  defaultAdminSettings,
  type AdminSettings,
} from './admin-settings.types';

export function adminSettingsFrom(
  value: Record<string, unknown> | undefined,
): AdminSettings {
  const stored = value ?? {};
  return {
    storeName: text(stored.storeName, defaultAdminSettings.storeName),
    supportEmail: text(stored.supportEmail, defaultAdminSettings.supportEmail),
    storefrontActive: bool(
      stored.storefrontActive,
      defaultAdminSettings.storefrontActive,
    ),
    newOrderAlerts: bool(
      stored.newOrderAlerts,
      defaultAdminSettings.newOrderAlerts,
    ),
    paymentFailureAlerts: bool(
      stored.paymentFailureAlerts,
      defaultAdminSettings.paymentFailureAlerts,
    ),
    lowStockDigest: bool(
      stored.lowStockDigest,
      defaultAdminSettings.lowStockDigest,
    ),
    handlingDays: integer(
      stored.handlingDays,
      defaultAdminSettings.handlingDays,
    ),
    carbonNeutralDelivery: bool(
      stored.carbonNeutralDelivery,
      defaultAdminSettings.carbonNeutralDelivery,
    ),
    requireAddressValidation: bool(
      stored.requireAddressValidation,
      defaultAdminSettings.requireAddressValidation,
    ),
    sessionTimeoutMinutes: integer(
      stored.sessionTimeoutMinutes,
      defaultAdminSettings.sessionTimeoutMinutes,
    ),
  };
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function integer(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value)
    ? value
    : fallback;
}
