import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { ProductImage } from './admin-product.types';
import { imageSignatureAllowed } from './admin-product.utils';

export interface UploadedProductImage {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class ProductImageService {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async upload(
    productId: string,
    file: UploadedProductImage | undefined,
    alt: string,
  ): Promise<ProductImage> {
    this.validate(file);
    const imageId = randomUUID();
    const extension = extensions[file.mimetype];
    const storagePath = `products/${productId}/${imageId}.${extension}`;
    const token = randomUUID();
    const bucket = this.firebase.storage.bucket();
    await bucket.file(storagePath).save(file.buffer, {
      resumable: false,
      validation: 'md5',
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public,max-age=31536000,immutable',
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    const encoded = encodeURIComponent(storagePath);
    return {
      id: imageId,
      storagePath,
      alt: alt.trim(),
      url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`,
    };
  }

  async remove(storagePath: string): Promise<void> {
    if (!storagePath.startsWith('products/')) return;
    await this.firebase.storage.bucket().file(storagePath).delete({
      ignoreNotFound: true,
    });
  }

  private validate(
    file: UploadedProductImage | undefined,
  ): asserts file is UploadedProductImage {
    if (!file) throw new BadRequestException('An image file is required.');
    if (file.size < 1 || file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Images must be no larger than 5 MB.');
    }
    if (!extensions[file.mimetype] || !imageSignatureAllowed(file.buffer)) {
      throw new BadRequestException('Upload a JPEG, PNG, or WebP image.');
    }
  }
}

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
