jest.mock('../../auth/firebase-admin.service', () => ({
  FirebaseAdminService: class FirebaseAdminService {},
}));

import type { FirebaseAdminService } from '../../auth/firebase-admin.service';
import {
  PRODUCT_IMAGE_MAX_BYTES,
  ProductImageService,
} from './product-image.service';

describe('ProductImageService upload limits', () => {
  const service = new ProductImageService({} as FirebaseAdminService);

  it('rejects product images above the shared twelve megabyte limit', async () => {
    await expect(
      service.upload(
        'product-1',
        {
          buffer: Buffer.alloc(8),
          mimetype: 'image/png',
          originalname: 'large.png',
          size: PRODUCT_IMAGE_MAX_BYTES + 1,
        },
        'Large product image',
      ),
    ).rejects.toThrow('Images must be no larger than 12 MB.');
  });
});
