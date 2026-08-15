import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';

@Injectable()
export class CustomizationsRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async get(id: string) {
    const snapshot = await this.customizationRef(id).get();
    return snapshot.exists
      ? { id: snapshot.id, data: snapshot.data() ?? {} }
      : null;
  }

  productRef(id: string) {
    return this.firebase.firestore.collection('products').doc(id);
  }

  customizationRef(id?: string) {
    const collection = this.firebase.firestore.collection('customizations');
    return id ? collection.doc(id) : collection.doc();
  }
}
