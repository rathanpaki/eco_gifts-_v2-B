import 'dotenv/config';
import { deleteApp } from 'firebase-admin/app';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { EnvironmentConfig } from '../config/environment.config';
import {
  seedAssetRoot,
  seedCatalogSummary,
  testProductCatalog,
  validateSeedCatalog,
} from './product-seed.catalog';
import {
  verifySeedProducts,
  writeSeedProducts,
} from './product-seed.firestore';
import { uploadSeedImages } from './product-seed.storage';

async function seedTestProducts(): Promise<void> {
  const assetRoot = seedAssetRoot();
  validateSeedCatalog(assetRoot);
  process.stdout.write(`Validated ${seedCatalogSummary()}.\n`);
  if (process.argv.includes('--dry-run')) return;

  const firebase = new FirebaseAdminService(new EnvironmentConfig());
  try {
    if (!process.argv.includes('--verify-only')) {
      const images = await uploadSeedImages(
        firebase,
        assetRoot,
        testProductCatalog,
      );
      await writeSeedProducts(firebase, testProductCatalog, images);
      process.stdout.write(
        `Uploaded ${images.size} reusable catalog images.\n`,
      );
    }
    await verifySeedProducts(firebase, testProductCatalog);
    process.stdout.write('Verified all 30 test products in Firestore.\n');
  } finally {
    await deleteApp(firebase.app);
  }
}

void seedTestProducts().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Product seed failed: ${message}\n`);
  process.exitCode = 1;
});
