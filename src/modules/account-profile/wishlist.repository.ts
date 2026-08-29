import { Injectable } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { ProductStatus } from '../admin-products/product-status.enum';

@Injectable()
export class WishlistRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async list(userId: string) {
    const saved = await this.collection(userId)
      .orderBy('createdAt', 'desc')
      .get();
    if (saved.empty) return [];
    const products = await this.firebase.firestore.getAll(
      ...saved.docs.map((document) =>
        this.firebase.firestore.collection('products').doc(document.id),
      ),
    );
    return products
      .map((product, index) => ({ product, saved: saved.docs[index] }))
      .filter(
        ({ product }) =>
          product.exists && product.get('status') === ProductStatus.ACTIVE,
      );
  }

  async add(userId: string, productId: string, customizationId?: string) {
    const product = await this.firebase.firestore
      .collection('products')
      .doc(productId)
      .get();
    if (!product.exists || product.get('status') !== ProductStatus.ACTIVE)
      return null;
    const customization = customizationId
      ? await this.firebase.firestore
          .collection('customizations')
          .doc(customizationId)
          .get()
      : null;
    if (
      customization &&
      (!customization.exists ||
        customization.get('userId') !== userId ||
        customization.get('productId') !== productId ||
        customization.get('status') !== 'active')
    )
      return null;
    const savedCustomization = customization
      ? {
          id: customization.id,
          previewPath: customization.get('previewPath') as string,
        }
      : null;
    await this.collection(userId)
      .doc(productId)
      .set(
        {
          productId,
          customizationId: savedCustomization?.id ?? null,
          previewPath: savedCustomization?.previewPath ?? null,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    return { product, savedCustomization };
  }

  async remove(userId: string, productId: string) {
    await this.collection(userId).doc(productId).delete();
  }
  private collection(userId: string) {
    return this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('wishlist');
  }
}
