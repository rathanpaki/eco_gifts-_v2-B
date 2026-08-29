import type { Firestore } from 'firebase-admin/firestore';

export const cartRef = (firestore: Firestore, id: string) =>
  firestore.collection('carts').doc(id);
export const orderRef = (firestore: Firestore, id: string) =>
  firestore.collection('orders').doc(id);
export const productRef = (firestore: Firestore, id: string) =>
  firestore.collection('products').doc(id);
export const userRef = (firestore: Firestore, id: string) =>
  firestore.collection('users').doc(id);
export const contributionRef = (firestore: Firestore, id: string) =>
  firestore.collection('ecoContributions').doc(id);
export const treeRef = (firestore: Firestore, id: string) =>
  firestore.collection('treeRecords').doc(id);
