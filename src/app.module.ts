import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { ProductsModule } from './modules/products/products.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { AdminProductsModule } from './modules/admin-products/admin-products.module';
import { CartModule } from './modules/cart/cart.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomizationsModule } from './modules/customizations/customizations.module';
import { AdminOrdersModule } from './modules/admin-orders/admin-orders.module';
import { AdminCustomersModule } from './modules/admin-customers/admin-customers.module';
import { EcoContributionModule } from './modules/eco-contribution/eco-contribution.module';
import { AdminInventoryModule } from './modules/admin-inventory/admin-inventory.module';
import { AccountProfileModule } from './modules/account-profile/account-profile.module';
import { AdminPromotionsModule } from './modules/admin-promotions/admin-promotions.module';
import { AdminSettingsModule } from './modules/admin-settings/admin-settings.module';
import { ProductReviewsModule } from './modules/product-reviews/product-reviews.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    ProductsModule,
    AdminDashboardModule,
    AdminProductsModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    CustomizationsModule,
    AdminOrdersModule,
    AdminCustomersModule,
    EcoContributionModule,
    AdminInventoryModule,
    AccountProfileModule,
    AdminPromotionsModule,
    AdminSettingsModule,
    ProductReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
