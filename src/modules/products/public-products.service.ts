import { Injectable, NotFoundException } from '@nestjs/common';
import { mapPublicProduct } from './public-product.mapper';
import { normalizeProductQuery } from './public-product-query';
import type {
  FeaturedProductsQueryDto,
  PublicProductsQueryDto,
} from './public-products.dto';
import { PublicProductsRepository } from './public-products.repository';
import type { PublicProduct, PublicProductPage } from './product.types';

@Injectable()
export class PublicProductsService {
  constructor(private readonly repository: PublicProductsRepository) {}

  async list(query: PublicProductsQueryDto): Promise<PublicProductPage> {
    const page = await this.repository.list(normalizeProductQuery(query));
    return {
      items: page.docs.map((document) =>
        mapPublicProduct(document.id, document.data),
      ),
      nextCursor: page.nextCursor,
    };
  }

  async getBySlug(slug: string): Promise<PublicProduct> {
    const document = await this.repository.findBySlug(slug);
    if (!document) throw new NotFoundException('Product not found.');
    return mapPublicProduct(document.id, document.data);
  }

  async featured(query: FeaturedProductsQueryDto): Promise<PublicProduct[]> {
    const page = await this.repository.list({
      searchTokens: [],
      sort: 'featured',
      limit: query.limit,
    });
    return page.docs.map((document) =>
      mapPublicProduct(document.id, document.data),
    );
  }
}
