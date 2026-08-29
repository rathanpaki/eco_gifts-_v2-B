import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { AccountProfileService } from './account-profile.service';
import {
  PROFILE_PHOTO_MAX_BYTES,
  type ProfilePhotoFile,
} from './profile-photo.service';
import type {
  AccountAddress,
  AccountProfile,
  GiftPreferences,
  WishlistProduct,
} from './account-profile.types';
import { AddressParamsDto } from './dto/address-params.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { WishlistParamsDto } from './dto/wishlist-params.dto';
import { WriteAddressDto } from './dto/write-address.dto';
import { WriteWishlistDto } from './dto/write-wishlist.dto';

@Controller('account')
@UseGuards(SessionAuthGuard)
export class AccountProfileController {
  constructor(private readonly profiles: AccountProfileService) {}

  @Get('profile')
  get(@CurrentUser() user: AuthenticatedUser): Promise<AccountProfile> {
    return this.profiles.get(user);
  }

  @Patch('profile')
  @UseGuards(CsrfGuard)
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ): Promise<AccountProfile> {
    return this.profiles.updateProfile(user, body.displayName, body.phone);
  }

  @Post('profile/photo')
  @UseGuards(CsrfGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { files: 1, fileSize: PROFILE_PHOTO_MAX_BYTES },
    }),
  )
  updatePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: ProfilePhotoFile | undefined,
  ): Promise<AccountProfile> {
    return this.profiles.updatePhoto(user, file);
  }

  @Post('addresses')
  @UseGuards(CsrfGuard)
  createAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: WriteAddressDto,
  ): Promise<AccountAddress> {
    return this.profiles.createAddress(user, body);
  }

  @Put('addresses/:addressId')
  @UseGuards(CsrfGuard)
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: AddressParamsDto,
    @Body() body: WriteAddressDto,
  ): Promise<AccountAddress> {
    return this.profiles.updateAddress(user, params.addressId, body);
  }

  @Delete('addresses/:addressId')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: AddressParamsDto,
  ): Promise<void> {
    return this.profiles.deleteAddress(user.uid, params.addressId);
  }

  @Get('wishlist')
  wishlist(@CurrentUser() user: AuthenticatedUser): Promise<WishlistProduct[]> {
    return this.profiles.wishlist(user.uid);
  }

  @Post('wishlist/:productId')
  @UseGuards(CsrfGuard)
  addWishlist(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: WishlistParamsDto,
    @Body() body: WriteWishlistDto,
  ): Promise<WishlistProduct> {
    return this.profiles.addWishlist(
      user.uid,
      params.productId,
      body.customizationId,
    );
  }

  @Delete('wishlist/:productId')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  removeWishlist(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: WishlistParamsDto,
  ): Promise<void> {
    return this.profiles.removeWishlist(user.uid, params.productId);
  }

  @Get('preferences')
  preferences(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GiftPreferences> {
    return this.profiles.preferences(user.uid);
  }

  @Put('preferences')
  @UseGuards(CsrfGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdatePreferencesDto,
  ): Promise<GiftPreferences> {
    return this.profiles.updatePreferences(user.uid, body);
  }

  @Get('export')
  export(@CurrentUser() user: AuthenticatedUser) {
    return this.profiles.export(user);
  }
}
