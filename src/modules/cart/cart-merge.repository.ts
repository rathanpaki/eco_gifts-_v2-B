import { Injectable } from '@nestjs/common';
import type { DocumentReference } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { EnvironmentConfig } from '../../config/environment.config';
import { mergeCartItems, readOwnedCart, writeCartData } from './cart.documents';
import { mapStoredCart } from './cart.mapper';
import type { CartIdentity } from './cart.types';

@Injectable()
export class CartMergeRepository {
  constructor(
    private readonly firebase: FirebaseAdminService,
    private readonly config: EnvironmentConfig,
  ) {}

  async mergeGuest(identity: CartIdentity): Promise<void> {
    if (!identity.guestCartId) return;
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const userRef = this.cartRef(identity.cartId);
      const guestRef = this.cartRef(identity.guestCartId!);
      const userSnapshot = await transaction.get(userRef);
      const guestSnapshot = await transaction.get(guestRef);
      if (!guestSnapshot.exists) return;
      const user = readOwnedCart(userSnapshot, identity);
      const guest = mapStoredCart(guestSnapshot.data() ?? {});
      const items = mergeCartItems(user.items, guest);
      transaction.set(
        userRef,
        writeCartData(
          identity,
          items,
          !userSnapshot.exists,
          this.config.cartTtlMilliseconds,
        ),
        { merge: true },
      );
      transaction.delete(guestRef);
    });
  }

  private cartRef(id: string): DocumentReference {
    return this.firebase.firestore.collection('carts').doc(id);
  }
}
