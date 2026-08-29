import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { mapProductReview } from './product-review.mapper';
import { ProductReviewsRepository } from './product-reviews.repository';
import type {
  CreateProductReviewInput,
  ProductReview,
  ProductReviewFeed,
} from './product-review.types';

@Injectable()
export class ProductReviewsService {
  constructor(private readonly reviews: ProductReviewsRepository) {}

  async list(productId: string, limit: number): Promise<ProductReviewFeed> {
    const result = await this.reviews.list(productId, limit);
    return {
      items: result.docs.map((item) =>
        mapProductReview(item.id, item.data()),
      ),
      averageRating: result.count
        ? Math.round((result.ratingTotal / result.count) * 10) / 10
        : 0,
      totalReviews: result.count,
    };
  }

  async reviewedProducts(userId: string, orderId: string) {
    const snapshot = await this.reviews.reviewedProducts(orderId, userId);
    return {
      productIds: snapshot.docs
        .map((item) => item.get('productId'))
        .filter((value): value is string => typeof value === 'string'),
    };
  }

  async create(
    user: AuthenticatedUser,
    input: CreateProductReviewInput,
  ): Promise<ProductReview> {
    const snapshot = await this.reviews.create(user, input);
    return mapProductReview(snapshot.id, snapshot.data() ?? {});
  }
}
