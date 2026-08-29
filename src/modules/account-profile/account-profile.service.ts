import { Injectable, NotFoundException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CustomerPrivacyRepository } from '../admin-customers/customer-privacy.repository';
import { mapPublicProduct } from '../products/public-product.mapper';
import { mapAddress } from './account-profile.mapper';
import { AccountProfileRepository } from './account-profile.repository';
import { defaultGiftPreferences } from './account-profile.types';
import type {
  AccountAddress,
  AccountProfile,
  AddressValues,
  GiftPreferences,
  WishlistProduct,
} from './account-profile.types';
import {
  ProfilePhotoService,
  type ProfilePhotoFile,
} from './profile-photo.service';
import { WishlistRepository } from './wishlist.repository';

@Injectable()
export class AccountProfileService {
  constructor(
    private readonly profiles: AccountProfileRepository,
    private readonly privacy: CustomerPrivacyRepository,
    private readonly photos: ProfilePhotoService,
    private readonly saved: WishlistRepository,
  ) {}

  async get(user: AuthenticatedUser): Promise<AccountProfile> {
    const [profile, addresses] = await Promise.all([
      this.profiles.profile(user.uid),
      this.profiles.addresses(user.uid),
    ]);
    const storedName: unknown = profile.get('displayName');
    return {
      displayName:
        typeof storedName === 'string' && storedName.trim()
          ? storedName
          : user.displayName?.trim() || '',
      email: user.email,
      emailVerified: user.emailVerified,
      phone: optionalText(profile.get('phone')),
      phoneVerified:
        optionalText(profile.get('phone')) !== null &&
        profile.get('phoneVerifiedAt') instanceof Timestamp,
      avatarUrl: optionalText(profile.get('avatarUrl')),
      addresses: addresses.docs.map(mapAddress),
    };
  }

  async updateProfile(
    user: AuthenticatedUser,
    displayName: string,
    phone?: string,
  ): Promise<AccountProfile> {
    const name = displayName.trim();
    await this.profiles.updateProfile(user.uid, name, phone);
    return this.get({ ...user, displayName: name });
  }

  async updatePhoto(
    user: AuthenticatedUser,
    file: ProfilePhotoFile | undefined,
  ): Promise<AccountProfile> {
    await this.photos.upload(user, file);
    return this.get(user);
  }

  async createAddress(
    user: AuthenticatedUser,
    values: AddressValues,
  ): Promise<AccountAddress> {
    return mapAddress(await this.profiles.createAddress(user.uid, values));
  }

  async updateAddress(
    user: AuthenticatedUser,
    addressId: string,
    values: AddressValues,
  ): Promise<AccountAddress> {
    const result = await this.profiles.updateAddress(
      user.uid,
      addressId,
      values,
    );
    if (!result) throw new NotFoundException('Address not found.');
    return mapAddress(result);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const removed = await this.profiles.deleteAddress(userId, addressId);
    if (!removed) throw new NotFoundException('Address not found.');
  }

  async wishlist(userId: string): Promise<WishlistProduct[]> {
    const entries = await this.saved.list(userId);
    return entries.map(({ product, saved }) => ({
      ...mapPublicProduct(product.id, product.data() ?? {}),
      savedCustomization: savedCustomization(saved.data() ?? {}),
    }));
  }

  async addWishlist(
    userId: string,
    productId: string,
    customizationId?: string,
  ): Promise<WishlistProduct> {
    const result = await this.saved.add(userId, productId, customizationId);
    if (!result)
      throw new NotFoundException('Product or customization not found.');
    return {
      ...mapPublicProduct(result.product.id, result.product.data() ?? {}),
      savedCustomization: result.savedCustomization,
    };
  }

  async removeWishlist(userId: string, productId: string): Promise<void> {
    await this.saved.remove(userId, productId);
  }

  async preferences(userId: string): Promise<GiftPreferences> {
    const saved = await this.profiles.preferences(userId);
    return {
      ...defaultGiftPreferences,
      ...saved,
      occasions: saved?.occasions ?? defaultGiftPreferences.occasions,
    };
  }

  async updatePreferences(
    userId: string,
    values: GiftPreferences,
  ): Promise<GiftPreferences> {
    await this.profiles.updatePreferences(userId, values);
    return values;
  }

  async export(user: AuthenticatedUser) {
    const [account, records] = await Promise.all([
      this.get(user),
      this.privacy.exportCollections(user.uid),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      account,
      records,
    };
  }
}

function savedCustomization(value: FirebaseFirestore.DocumentData) {
  return typeof value.customizationId === 'string' &&
    typeof value.previewPath === 'string'
    ? { id: value.customizationId, previewPath: value.previewPath }
    : null;
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
