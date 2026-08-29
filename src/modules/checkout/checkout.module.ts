import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminPromotionsModule } from '../admin-promotions/admin-promotions.module';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { CartModule } from '../cart/cart.module';
import { EcoContributionModule } from '../eco-contribution/eco-contribution.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutRepository } from './checkout.repository';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [
    AuthModule,
    AdminPromotionsModule,
    AdminSettingsModule,
    CartModule,
    EcoContributionModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutRepository, CheckoutService],
})
export class CheckoutModule {}
