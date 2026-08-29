import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase-admin/firestore';
import type { GiftProfile, GiftProfileValues } from './account-saved.types';
import { GiftProfilesRepository } from './gift-profiles.repository';

@Injectable()
export class GiftProfilesService {
  constructor(private readonly profiles: GiftProfilesRepository) {}

  async list(userId: string): Promise<GiftProfile[]> {
    const snapshot = await this.profiles.list(userId);
    return snapshot.docs.map(mapGiftProfile);
  }

  async create(
    userId: string,
    values: GiftProfileValues,
  ): Promise<GiftProfile> {
    return mapGiftProfile(await this.profiles.create(userId, values));
  }

  async update(
    userId: string,
    id: string,
    values: GiftProfileValues,
  ): Promise<GiftProfile> {
    const snapshot = await this.profiles.update(userId, id, values);
    if (!snapshot) throw new NotFoundException('Gift profile not found.');
    return mapGiftProfile(snapshot);
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!(await this.profiles.remove(userId, id))) {
      throw new NotFoundException('Gift profile not found.');
    }
  }
}

function mapGiftProfile(snapshot: DocumentSnapshot<DocumentData>): GiftProfile {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    recipientName: text(data.recipientName),
    relationship: text(data.relationship),
    occasion: text(data.occasion),
    importantDate: optionalText(data.importantDate),
    notes: optionalText(data.notes),
    createdAt: date(data.createdAt),
    updatedAt: date(data.updatedAt),
  };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function optionalText(value: unknown): string | null {
  const result = text(value).trim();
  return result || null;
}
function date(value: unknown): string {
  return value instanceof Timestamp
    ? value.toDate().toISOString()
    : new Date(0).toISOString();
}
