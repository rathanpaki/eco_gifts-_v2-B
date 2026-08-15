import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { parseCustomizationDesign } from './customization-design.validator';
import { CustomizationStorageService } from './customization-storage.service';
import type {
  Customization,
  UploadedCustomizationPreview,
} from './customization.types';
import { CustomizationsRepository } from './customizations.repository';
import type { CreateCustomizationDto } from './dto/create-customization.dto';

@Injectable()
export class CustomizationsService {
  constructor(
    private readonly repository: CustomizationsRepository,
    private readonly storage: CustomizationStorageService,
  ) {}

  async create(
    user: AuthenticatedUser,
    file: UploadedCustomizationPreview | undefined,
    input: CreateCustomizationDto,
  ): Promise<Customization> {
    const design = parseCustomizationDesign(input.designJson);
    const product = await this.repository.productRef(input.productId).get();
    const productData = product.data();
    if (
      !product.exists ||
      productData?.status !== 'active' ||
      productData.personalizationAvailable !== true
    ) {
      throw new BadRequestException(
        'This product does not support personalization.',
      );
    }
    const reference = this.repository.customizationRef();
    const storagePath = `customizations/${ownerKey(user.uid)}/${reference.id}/preview.png`;
    const previewPath = `/api/customizations/${reference.id}/preview`;
    const createdAt = Timestamp.now();
    await this.storage.upload(storagePath, file);
    try {
      await reference.create({
        userId: user.uid,
        productId: input.productId,
        previewPath,
        storagePath,
        design,
        status: 'active',
        createdAt,
        updatedAt: createdAt,
      });
    } catch (error) {
      await this.storage.remove(storagePath);
      throw error;
    }
    return {
      id: reference.id,
      productId: input.productId,
      previewPath,
      design,
      createdAt: createdAt.toDate().toISOString(),
    };
  }

  async preview(userId: string, customizationId: string): Promise<Buffer> {
    const stored = await this.owned(userId, customizationId);
    const storagePath: unknown = stored.data.storagePath;
    if (typeof storagePath !== 'string') {
      throw new NotFoundException('Customization not found.');
    }
    return this.storage.download(storagePath);
  }

  private async owned(userId: string, customizationId: string) {
    const stored = await this.repository.get(customizationId);
    if (
      !stored ||
      stored.data.userId !== userId ||
      stored.data.status !== 'active'
    ) {
      throw new NotFoundException('Customization not found.');
    }
    return stored;
  }
}

function ownerKey(userId: string): string {
  return createHash('sha256').update(userId).digest('base64url');
}
