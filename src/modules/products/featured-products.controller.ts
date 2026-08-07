import { Controller, Get, Query } from '@nestjs/common';
import type { PublicProduct } from './product.types';
import { FeaturedProductsQueryDto } from './public-products.dto';
import { PublicProductsService } from './public-products.service';

@Controller('public/products')
export class FeaturedProductsController {
  constructor(private readonly products: PublicProductsService) {}

  @Get('featured')
  featured(@Query() query: FeaturedProductsQueryDto): Promise<PublicProduct[]> {
    return this.products.featured(query);
  }
}
