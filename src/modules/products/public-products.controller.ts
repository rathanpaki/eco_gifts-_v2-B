import { Controller, Get, Param, Query } from '@nestjs/common';
import type { PublicProduct, PublicProductPage } from './product.types';
import {
  PublicProductSlugDto,
  PublicProductsQueryDto,
} from './public-products.dto';
import { PublicProductsService } from './public-products.service';

@Controller('products')
export class PublicProductsController {
  constructor(private readonly products: PublicProductsService) {}

  @Get()
  list(@Query() query: PublicProductsQueryDto): Promise<PublicProductPage> {
    return this.products.list(query);
  }

  @Get(':slug')
  get(@Param() params: PublicProductSlugDto): Promise<PublicProduct> {
    return this.products.getBySlug(params.slug);
  }
}
