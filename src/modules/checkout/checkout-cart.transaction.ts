import type {
  DocumentSnapshot,
  Firestore,
  Transaction,
} from 'firebase-admin/firestore';
import { readOwnedCart } from '../cart/cart.documents';
import { mapCart } from '../cart/cart.mapper';
import type { Cart, CartIdentity } from '../cart/cart.types';
import { cartRef, productRef, userRef } from './checkout-references';

export async function readCheckoutCart(
  transaction: Transaction,
  firestore: Firestore,
  identity: CartIdentity,
): Promise<{
  cart: Cart;
  cartReference: FirebaseFirestore.DocumentReference;
  productSnapshots: DocumentSnapshot[];
  userReference: FirebaseFirestore.DocumentReference;
  userSnapshot: DocumentSnapshot;
}> {
  const cartReference = cartRef(firestore, identity.cartId);
  const userReference = userRef(firestore, identity.ownerId);
  const [cartSnapshot, userSnapshot] = await Promise.all([
    transaction.get(cartReference),
    transaction.get(userReference),
  ]);
  const stored = readOwnedCart(cartSnapshot, identity);
  const ids = [...new Set(stored.items.map((item) => item.productId))];
  const references = ids.map((id) => productRef(firestore, id));
  const productSnapshots = references.length
    ? await transaction.getAll(...references)
    : [];
  const cart = mapCart(
    stored,
    productSnapshots.map((snapshot) => ({
      id: snapshot.id,
      data: snapshot.data() ?? {},
    })),
  );
  return { cart, cartReference, productSnapshots, userReference, userSnapshot };
}
