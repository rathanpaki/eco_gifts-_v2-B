jest.mock('../../auth/firebase-admin.service', () => ({
  FirebaseAdminService: class FirebaseAdminService {},
}));

import type { FirebaseAdminService } from '../../auth/firebase-admin.service';
import {
  PROFILE_PHOTO_MAX_BYTES,
  ProfilePhotoService,
} from './profile-photo.service';

describe('ProfilePhotoService upload limits', () => {
  const service = new ProfilePhotoService({} as FirebaseAdminService);

  it('rejects profile photos above the shared two megabyte limit', async () => {
    await expect(
      service.upload({ uid: 'user-1' } as never, {
        buffer: Buffer.alloc(8),
        mimetype: 'image/jpeg',
        size: PROFILE_PHOTO_MAX_BYTES + 1,
      }),
    ).rejects.toThrow(
      'Upload a JPEG, PNG, or WebP profile photo no larger than 2 MB.',
    );
  });
});
