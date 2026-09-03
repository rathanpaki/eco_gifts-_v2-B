import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/auth.types';
import {
  CreateProductReviewDto,
  OrderReviewParamsDto,
  ProductReviewParamsDto,
  ProductReviewQueryDto,
} from './dto/product-review.dto';
import { ProductReviewsService } from './product-reviews.service';
import type { ProductReview, ProductReviewFeed } from './product-review.types';

@Controller('product-reviews')
export class ProductReviewsController {
  constructor(private readonly reviews: ProductReviewsService) {}

  @Get('product/:productId')
  list(
    @Param() params: ProductReviewParamsDto,
    @Query() query: ProductReviewQueryDto,
  ): Promise<ProductReviewFeed> {
    return this.reviews.list(params.productId, query.limit);
  }

  @Get('order/:orderId')
  @UseGuards(SessionAuthGuard)
  reviewedProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: OrderReviewParamsDto,
  ) {
    return this.reviews.reviewedProducts(user.uid, params.orderId);
  }

  @Post()
  @UseGuards(SessionAuthGuard, CsrfGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateProductReviewDto,
  ): Promise<ProductReview> {
    return this.reviews.create(user, input);
  }
}
