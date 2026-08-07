import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminProductImagesService } from './admin-product-images.service';
import { AdminProductsController } from './admin-products.controller';
import { AdminProductsRepository } from './admin-products.repository';
import { AdminProductsService } from './admin-products.service';
import { ProductImageService } from './product-image.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminProductsController],
  providers: [
    AdminProductsService,
    AdminProductImagesService,
    AdminProductsRepository,
    ProductImageService,
  ],
})
export class AdminProductsModule {}
