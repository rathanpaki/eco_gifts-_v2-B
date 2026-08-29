import { Timestamp } from 'firebase-admin/firestore';
import type { FirebaseAdminService } from '../auth/firebase-admin.service';
import { productSlug } from '../modules/admin-products/admin-product.utils';
import { productValues } from '../modules/admin-products/admin-product.values';
import { mapPublicProduct } from '../modules/products/public-product.mapper';
import type { SeedImageLocation } from './product-seed.storage';
import {
  productWriteInput,
  type SeedProductDefinition,
} from './product-seed.types';

export async function writeSeedProducts(
  firebase: FirebaseAdminService,
  products: SeedProductDefinition[],
  images: Map<string, SeedImageLocation>,
): Promise<void> {
  const db = firebase.firestore;
  const productRefs = products.map((item) =>
    db.collection('products').doc(item.id),
  );
  const slugRefs = products.map((item) =>
    db.collection('productSlugs').doc(productSlug(item.name)),
  );
  const skuRefs = products.map((item) =>
    db.collection('productSkus').doc(item.sku),
  );
  const snapshots = await db.getAll(...productRefs, ...slugRefs, ...skuRefs);
  const byPath = new Map(snapshots.map((item) => [item.ref.path, item]));
  assertLocks(products, slugRefs, skuRefs, byPath);

  const now = Timestamp.now();
  const batch = db.batch();
  products.forEach((product, index) => {
    const image = images.get(product.imageFile);
    if (!image) throw new Error(`No uploaded image for ${product.imageFile}.`);
    const existing = byPath.get(productRefs[index].path);
    const savedCreatedAt: unknown = existing?.get('createdAt');
    batch.set(productRefs[index], {
      ...productValues(productWriteInput(product)),
      slug: productSlug(product.name),
      images: [{ id: 'primary', ...image, alt: product.imageAlt }],
      featuredRank: product.featuredRank,
      createdAt: savedCreatedAt instanceof Timestamp ? savedCreatedAt : now,
      updatedAt: now,
    });
    batch.set(slugRefs[index], { productId: product.id });
    batch.set(skuRefs[index], { productId: product.id });
  });
  batch.create(db.collection('auditLogs').doc(), {
    action: 'products.test-catalog.seeded',
    actorUid: 'operator',
    productCount: products.length,
    createdAt: now,
  });
  await batch.commit();
}

export async function verifySeedProducts(
  firebase: FirebaseAdminService,
  products: SeedProductDefinition[],
): Promise<void> {
  const refs = products.map((item) =>
    firebase.firestore.collection('products').doc(item.id),
  );
  const snapshots = await firebase.firestore.getAll(...refs);
  for (const snapshot of snapshots) {
    if (!snapshot.exists) throw new Error(`Missing product ${snapshot.id}.`);
    const mapped = mapPublicProduct(snapshot.id, snapshot.data()!);
    const expected = products.find((item) => item.id === snapshot.id);
    if (
      !expected ||
      mapped.name !== expected.name ||
      mapped.images.length < 1
    ) {
      throw new Error(`Product verification failed for ${snapshot.id}.`);
    }
  }
}

function assertLocks(
  products: SeedProductDefinition[],
  slugRefs: FirebaseFirestore.DocumentReference[],
  skuRefs: FirebaseFirestore.DocumentReference[],
  snapshots: Map<string, FirebaseFirestore.DocumentSnapshot>,
): void {
  products.forEach((product, index) => {
    assertLock(slugRefs[index].path, product.id, snapshots);
    assertLock(skuRefs[index].path, product.id, snapshots);
  });
}

function assertLock(
  path: string,
  productId: string,
  snapshots: Map<string, FirebaseFirestore.DocumentSnapshot>,
): void {
  const lock = snapshots.get(path);
  if (lock?.exists && lock.get('productId') !== productId) {
    throw new Error(`${path} belongs to another product; seed aborted.`);
  }
}
