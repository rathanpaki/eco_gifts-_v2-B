import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { FeaturedProductsController } from './featured-products.controller';
import { PublicProductsController } from './public-products.controller';
import { PublicProductsRepository } from './public-products.repository';
import { PublicProductsService } from './public-products.service';

@Module({
  imports: [AuthModule],
  controllers: [PublicProductsController, FeaturedProductsController],
  providers: [PublicProductsService, PublicProductsRepository],
})
export class ProductsModule {}
