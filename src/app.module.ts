import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { ProductsModule } from './modules/products/products.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { AdminProductsModule } from './modules/admin-products/admin-products.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    ProductsModule,
    AdminDashboardModule,
    AdminProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
