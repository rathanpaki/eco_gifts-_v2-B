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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
