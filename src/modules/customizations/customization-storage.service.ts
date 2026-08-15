import { BadRequestException, Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { UploadedCustomizationPreview } from './customization.types';

const MAX_BYTES = 4 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PATH_PATTERN =
  /^customizations\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9_-]{1,128}\/preview\.png$/;

@Injectable()
export class CustomizationStorageService {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async upload(
    storagePath: string,
    file: UploadedCustomizationPreview | undefined,
  ): Promise<void> {
    this.validatePath(storagePath);
    this.validate(file);
    await this.firebase.storage
      .bucket()
      .file(storagePath)
      .save(file.buffer, {
        resumable: false,
        validation: 'md5',
        metadata: {
          contentType: 'image/png',
          contentDisposition: 'inline',
          cacheControl: 'private,max-age=3600',
        },
      });
  }

  async download(storagePath: string): Promise<Buffer> {
    this.validatePath(storagePath);
    const [buffer] = await this.firebase.storage
      .bucket()
      .file(storagePath)
      .download();
    return buffer;
  }

  async remove(storagePath: string): Promise<void> {
    this.validatePath(storagePath);
    await this.firebase.storage.bucket().file(storagePath).delete({
      ignoreNotFound: true,
    });
  }

  private validate(
    file: UploadedCustomizationPreview | undefined,
  ): asserts file is UploadedCustomizationPreview {
    if (!file || file.size < 100 || file.size > MAX_BYTES) {
      throw new BadRequestException(
        'Customization previews must be PNG files no larger than 4 MB.',
      );
    }
    if (
      file.mimetype !== 'image/png' ||
      !file.buffer.subarray(0, 8).equals(PNG_SIGNATURE) ||
      file.buffer.readUInt32BE(16) !== 400 ||
      file.buffer.readUInt32BE(20) !== 300
    ) {
      throw new BadRequestException(
        'Customization preview must be a 400 by 300 PNG image.',
      );
    }
  }

  private validatePath(storagePath: string): void {
    if (!PATH_PATTERN.test(storagePath)) {
      throw new BadRequestException('Customization storage path is invalid.');
    }
  }
}
