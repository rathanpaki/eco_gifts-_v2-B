import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { EnvironmentConfig } from '../../config/environment.config';
import {
  isCartExpired,
  productQuantity,
  readOwnedCart,
  validatedCustomization,
  validatedProduct,
  writeCartData,
} from './cart.documents';
import {
  mapStoredCart,
  productSnapshot as cartProductSnapshot,
} from './cart.mapper';
import {
  cartRef,
  customizationRef,
  getCartProducts,
  productRef,
} from './cart-references';
import type {
  CartIdentity,
  CartProductDocument,
  StoredCart,
} from './cart.types';

@Injectable()
export class CartRepository {
  constructor(
    private readonly firebase: FirebaseAdminService,
    private readonly config: EnvironmentConfig,
  ) {}

  async get(cartId: string): Promise<StoredCart | null> {
    const snapshot = await cartRef(this.firebase, cartId).get();
    if (!snapshot.exists || isCartExpired(snapshot.data())) return null;
    return mapStoredCart(snapshot.data() ?? {});
  }

  async getProducts(productIds: string[]): Promise<CartProductDocument[]> {
    return getCartProducts(this.firebase, productIds);
  }

  async add(
    identity: CartIdentity,
    productId: string,
    amount: number,
    customizationId?: string,
  ): Promise<void> {
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const cartReference = cartRef(this.firebase, identity.cartId);
      const references = [productRef(this.firebase, productId), cartReference];
      if (customizationId) {
        references.push(customizationRef(this.firebase, customizationId));
      }
      const [productSnapshot, cartSnapshot, customizationSnapshot] =
        await transaction.getAll(...references);
      const cart = readOwnedCart(cartSnapshot, identity);
      const itemId = customizationId ?? productId;
      const existing = cart.items.find((item) => item.itemId === itemId);
      const quantity = (existing?.quantity ?? 0) + amount;
      const product = validatedProduct(
        productSnapshot,
        productQuantity(cart.items, productId, itemId, quantity),
      );
      const customization = validatedCustomization(
        customizationSnapshot,
        identity,
        productId,
        customizationId,
      );
      if (!existing && cart.items.length >= 50) {
        throw new BadRequestException(
          'A cart can contain at most 50 products.',
        );
      }
      const next = existing
        ? { ...existing, quantity, product: cartProductSnapshot(product) }
        : {
            itemId,
            productId,
            quantity,
            addedAt: new Date().toISOString(),
            product: cartProductSnapshot(product),
            customization,
          };
      const items = existing
        ? cart.items.map((item) => (item.itemId === itemId ? next : item))
        : [...cart.items, next];
      transaction.set(
        cartReference,
        writeCartData(
          identity,
          items,
          !cartSnapshot.exists,
          this.config.cartTtlMilliseconds,
        ),
        { merge: true },
      );
    });
  }

  async setQuantity(
    identity: CartIdentity,
    itemId: string,
    quantity: number,
  ): Promise<void> {
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const cartReference = cartRef(this.firebase, identity.cartId);
      const cartSnapshot = await transaction.get(cartReference);
      const cart = readOwnedCart(cartSnapshot, identity);
      const existing = cart.items.find((item) => item.itemId === itemId);
      if (!existing) {
        throw new NotFoundException('The product is not in this cart.');
      }
      const productSnapshot = await transaction.get(
        productRef(this.firebase, existing.productId),
      );
      const product = validatedProduct(
        productSnapshot,
        productQuantity(cart.items, existing.productId, itemId, quantity),
      );
      const items = cart.items.map((item) =>
        item.itemId === itemId
          ? { ...item, quantity, product: cartProductSnapshot(product) }
          : item,
      );
      transaction.set(
        cartReference,
        writeCartData(identity, items, false, this.config.cartTtlMilliseconds),
        { merge: true },
      );
    });
  }

  async remove(identity: CartIdentity, itemId: string): Promise<void> {
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const reference = cartRef(this.firebase, identity.cartId);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) return;
      const cart = readOwnedCart(snapshot, identity);
      const items = cart.items.filter((item) => item.itemId !== itemId);
      if (items.length === cart.items.length) return;
      if (!items.length) transaction.delete(reference);
      else
        transaction.set(
          reference,
          writeCartData(
            identity,
            items,
            false,
            this.config.cartTtlMilliseconds,
          ),
          { merge: true },
        );
    });
  }
}
