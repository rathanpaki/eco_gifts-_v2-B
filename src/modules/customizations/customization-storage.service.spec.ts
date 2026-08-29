jest.mock('../../auth/firebase-admin.service', () => ({
  FirebaseAdminService: class FirebaseAdminService {},
}));

import type { FirebaseAdminService } from '../../auth/firebase-admin.service';
import {
  CUSTOMIZATION_PREVIEW_MAX_BYTES,
  CustomizationStorageService,
} from './customization-storage.service';

describe('CustomizationStorageService upload limits', () => {
  const service = new CustomizationStorageService({} as FirebaseAdminService);

  it('rejects previews above the shared five megabyte limit', async () => {
    await expect(
      service.upload('customizations/user-1/design-1/preview.png', {
        buffer: Buffer.alloc(24),
        mimetype: 'image/png',
        originalname: 'preview.png',
        size: CUSTOMIZATION_PREVIEW_MAX_BYTES + 1,
      }),
    ).rejects.toThrow(
      'Customization previews must be PNG files no larger than 5 MB.',
    );
  });
});
