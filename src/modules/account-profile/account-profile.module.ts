import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CustomerPrivacyRepository } from '../admin-customers/customer-privacy.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { AccountNotificationsController } from './account-notifications.controller';
import { AccountNotificationsService } from './account-notifications.service';
import { AccountProfileController } from './account-profile.controller';
import { AccountPhoneController } from './account-phone.controller';
import { AccountProfileRepository } from './account-profile.repository';
import { AccountProfileService } from './account-profile.service';
import { GiftProfilesController } from './gift-profiles.controller';
import { GiftProfilesRepository } from './gift-profiles.repository';
import { GiftProfilesService } from './gift-profiles.service';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsRepository } from './payment-methods.repository';
import { PaymentMethodsService } from './payment-methods.service';
import { ProfilePhotoService } from './profile-photo.service';
import { WishlistRepository } from './wishlist.repository';
import { PhoneVerificationRepository } from './phone-verification.repository';
import { PhoneVerificationService } from './phone-verification.service';

@Module({
  imports: [AuthModule],
  controllers: [
    AccountProfileController,
    AccountPhoneController,
    AccountNotificationsController,
    GiftProfilesController,
    PaymentMethodsController,
  ],
  providers: [
    AccountProfileRepository,
    AccountProfileService,
    AccountNotificationsService,
    GiftProfilesRepository,
    GiftProfilesService,
    PaymentMethodsRepository,
    PaymentMethodsService,
    ProfilePhotoService,
    PhoneVerificationRepository,
    PhoneVerificationService,
    WishlistRepository,
    OrdersRepository,
    CustomerPrivacyRepository,
  ],
})
export class AccountProfileModule {}
