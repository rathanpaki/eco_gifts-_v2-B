import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase-admin/firestore';
import type {
  PaymentMethodValues,
  SavedPaymentMethod,
} from './account-saved.types';
import { PaymentMethodsRepository } from './payment-methods.repository';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly methods: PaymentMethodsRepository) {}

  async list(userId: string): Promise<SavedPaymentMethod[]> {
    const snapshot = await this.methods.list(userId);
    return snapshot.docs.map(mapPaymentMethod);
  }

  async create(
    userId: string,
    values: PaymentMethodValues,
  ): Promise<SavedPaymentMethod> {
    const now = new Date();
    if (
      values.expiryYear < now.getFullYear() ||
      (values.expiryYear === now.getFullYear() &&
        values.expiryMonth < now.getMonth() + 1)
    ) {
      throw new BadRequestException('The card expiry date has passed.');
    }
    return mapPaymentMethod(await this.methods.create(userId, values));
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!(await this.methods.remove(userId, id))) {
      throw new NotFoundException('Saved card not found.');
    }
  }
}

function mapPaymentMethod(
  snapshot: DocumentSnapshot<DocumentData>,
): SavedPaymentMethod {
  const stored: unknown = snapshot.data();
  const data = record(stored);
  const brand = data.brand;
  const lastFour = text(data.lastFour);
  const createdAt = data.createdAt;
  return {
    id: snapshot.id,
    cardholderName: text(data.cardholderName),
    brand: brand === 'visa' || brand === 'mastercard' ? brand : 'card',
    lastFour: /^\d{4}$/.test(lastFour) ? lastFour : '0000',
    expiryMonth: integer(data.expiryMonth),
    expiryYear: integer(data.expiryYear),
    primary: data.primary === true,
    createdAt:
      createdAt instanceof Timestamp
        ? createdAt.toDate().toISOString()
        : new Date(0).toISOString(),
  };
}
function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function integer(value: unknown): number {
  return Number.isSafeInteger(value) ? (value as number) : 0;
}
