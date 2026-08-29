import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';

export interface ProfilePhotoFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export const PROFILE_PHOTO_MAX_MB = 2;
export const PROFILE_PHOTO_MAX_BYTES = PROFILE_PHOTO_MAX_MB * 1024 * 1024;

const imageTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class ProfilePhotoService {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async upload(
    user: AuthenticatedUser,
    file: ProfilePhotoFile | undefined,
  ): Promise<void> {
    const extension = file ? imageTypes[file.mimetype] : undefined;
    if (!file || !extension || file.size > PROFILE_PHOTO_MAX_BYTES) {
      throw new BadRequestException(
        `Upload a JPEG, PNG, or WebP profile photo no larger than ${PROFILE_PHOTO_MAX_MB} MB.`,
      );
    }
    const owner = createHash('sha256').update(user.uid).digest('base64url');
    const storagePath = `profiles/${owner}/avatar.${extension}`;
    const token = randomUUID();
    const bucket = this.firebase.storage.bucket();
    await bucket.file(storagePath).save(file.buffer, {
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public,max-age=3600',
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    const encoded = encodeURIComponent(storagePath);
    const avatarUrl =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}` +
      `?alt=media&token=${token}`;
    await Promise.all([
      this.firebase.auth.updateUser(user.uid, { photoURL: avatarUrl }),
      this.firebase.firestore.collection('users').doc(user.uid).set(
        {
          avatarUrl,
          avatarStoragePath: storagePath,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
    ]);
  }
}
