import { Injectable } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { type AdminSettings } from './admin-settings.types';
import { adminSettingsFrom } from './admin-settings.values';

@Injectable()
export class AdminSettingsService {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async get(): Promise<AdminSettings> {
    const snapshot = await this.reference.get();
    return adminSettingsFrom(snapshot.data());
  }

  async update(values: AdminSettings): Promise<AdminSettings> {
    const normalized = {
      ...values,
      storeName: values.storeName.trim(),
      supportEmail: values.supportEmail.trim().toLowerCase(),
    };
    await this.reference.set(
      {
        ...normalized,
        analyticsEnabled: FieldValue.delete(),
        orderSyncEnabled: FieldValue.delete(),
        webhookUrl: FieldValue.delete(),
        requireTwoStepVerification: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return normalized;
  }

  private get reference() {
    return this.firebase.firestore.collection('settings').doc('store');
  }
}
