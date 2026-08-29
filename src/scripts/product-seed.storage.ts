import { createHash } from 'node:crypto';
import { extname, resolve } from 'node:path';
import type { FirebaseAdminService } from '../auth/firebase-admin.service';
import type { SeedProductDefinition } from './product-seed.types';

export interface SeedImageLocation {
  url: string;
  storagePath: string;
}

export async function uploadSeedImages(
  firebase: FirebaseAdminService,
  assetRoot: string,
  products: SeedProductDefinition[],
): Promise<Map<string, SeedImageLocation>> {
  const bucket = firebase.storage.bucket();
  const imageFiles = [...new Set(products.map((item) => item.imageFile))];
  const entries = await Promise.all(
    imageFiles.map(async (imageFile) => {
      const storagePath = `product-images/test-catalog/${imageFile}`;
      const token = imageToken(imageFile);
      await bucket.upload(resolve(assetRoot, imageFile), {
        destination: storagePath,
        resumable: false,
        metadata: {
          cacheControl: 'public,max-age=31536000,immutable',
          contentType: contentType(imageFile),
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      const objectPath = encodeURIComponent(storagePath);
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${objectPath}?alt=media&token=${token}`;
      return [imageFile, { url, storagePath }] as const;
    }),
  );
  return new Map(entries);
}

function imageToken(imageFile: string): string {
  const hash = createHash('sha256')
    .update(`eco-gifts-test-catalog:${imageFile}`)
    .digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `a${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}

function contentType(imageFile: string): string {
  const extension = extname(imageFile).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
}
