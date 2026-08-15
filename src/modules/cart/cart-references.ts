import type { DocumentReference } from 'firebase-admin/firestore';
import type { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { CartProductDocument } from './cart.types';

export function cartRef(
  firebase: FirebaseAdminService,
  id: string,
): DocumentReference {
  return firebase.firestore.collection('carts').doc(id);
}

export function productRef(
  firebase: FirebaseAdminService,
  id: string,
): DocumentReference {
  return firebase.firestore.collection('products').doc(id);
}

export function customizationRef(
  firebase: FirebaseAdminService,
  id: string,
): DocumentReference {
  return firebase.firestore.collection('customizations').doc(id);
}

export async function getCartProducts(
  firebase: FirebaseAdminService,
  productIds: string[],
): Promise<CartProductDocument[]> {
  if (!productIds.length) return [];
  const references = productIds.map((id) => productRef(firebase, id));
  const snapshots = await firebase.firestore.getAll(...references);
  return snapshots
    .filter((item) => item.exists)
    .map((item) => ({ id: item.id, data: item.data() ?? {} }));
}
