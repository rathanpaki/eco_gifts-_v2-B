import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';
import type { AccountAddress } from './account-profile.types';

export function mapAddress(
  document: DocumentSnapshot<DocumentData>,
): AccountAddress {
  const data = document.data() ?? {};
  return {
    id: document.id,
    label: text(data.label),
    fullName: text(data.fullName),
    line1: text(data.line1),
    line2: optionalText(data.line2),
    city: text(data.city),
    region: optionalText(data.region),
    postalCode: text(data.postalCode),
    country: text(data.country),
    countryCode: countryCode(data.countryCode, data.country),
    phone: optionalText(data.phone),
    primary: data.primary === true,
  };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function optionalText(value: unknown): string | null {
  const resolved = text(value).trim();
  return resolved || null;
}

function countryCode(value: unknown, fallback: unknown): string {
  const code = text(value).trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return code;
  const country = text(fallback).toLowerCase();
  if (country.includes('united kingdom')) return 'GB';
  if (country.includes('united states')) return 'US';
  return 'GB';
}
