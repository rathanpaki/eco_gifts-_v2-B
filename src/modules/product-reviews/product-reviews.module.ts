import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ProductReviewsController } from './product-reviews.controller';
import { ProductReviewsRepository } from './product-reviews.repository';
import { ProductReviewsService } from './product-reviews.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductReviewsController],
  providers: [ProductReviewsRepository, ProductReviewsService],
})
export class ProductReviewsModule {}
