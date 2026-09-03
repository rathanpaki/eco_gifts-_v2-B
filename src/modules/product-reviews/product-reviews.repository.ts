import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { reviewEligibility } from './review-eligibility';
import type { CreateProductReviewInput } from './product-review.types';

@Injectable()
export class ProductReviewsRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async list(productId: string, limit: number) {
    const [product, reviews] = await Promise.all([
      this.firebase.firestore.collection('products').doc(productId).get(),
      this.reviews()
        .where('productId', '==', productId)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get(),
    ]);
    if (!product.exists) throw new NotFoundException('Product not found.');
    return {
      docs: reviews.docs,
      count: numeric(product.get('reviewCount')),
      ratingTotal: numeric(product.get('reviewRatingTotal')),
    };
  }

  async reviewedProducts(orderId: string, userId: string) {
    const order = await this.orders().doc(orderId).get();
    if (!order.exists || order.get('userId') !== userId) {
      throw new NotFoundException('Order not found.');
    }
    return this.reviews()
      .where('orderId', '==', orderId)
      .where('userId', '==', userId)
      .get();
  }

  async create(user: AuthenticatedUser, input: CreateProductReviewInput) {
    const orderRef = this.orders().doc(input.orderId);
    const productRef = this.firebase.firestore
      .collection('products')
      .doc(input.productId);
    const reviewRef = this.reviews().doc(`${input.orderId}_${input.productId}`);
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const [order, existing] = await Promise.all([
        transaction.get(orderRef),
        transaction.get(reviewRef),
      ]);
      if (!order.exists) throw new NotFoundException('Order not found.');
      const issue = reviewEligibility(
        order.data() ?? {},
        user.uid,
        input.productId,
      );
      if (issue === 'Order not found.') throw new NotFoundException(issue);
      if (issue) throw new BadRequestException(issue);
      if (existing.exists) {
        throw new ConflictException('You already reviewed this product.');
      }
      const now = Timestamp.now();
      transaction.create(reviewRef, {
        ...input,
        title: input.title?.trim() || null,
        comment: input.comment.trim(),
        userId: user.uid,
        displayName: displayName(user, order.data() ?? {}),
        verifiedPurchase: true,
        status: 'published',
        createdAt: now,
        updatedAt: now,
      });
      transaction.update(productRef, {
        reviewCount: FieldValue.increment(1),
        reviewRatingTotal: FieldValue.increment(input.rating),
        updatedAt: now,
      });
    });
    return reviewRef.get();
  }

  private reviews() {
    return this.firebase.firestore.collection('productReviews');
  }

  private orders() {
    return this.firebase.firestore.collection('orders');
  }
}

function numeric(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function displayName(
  user: AuthenticatedUser,
  order: FirebaseFirestore.DocumentData,
) {
  if (user.displayName?.trim()) return user.displayName.trim();
  const fullName = order.address?.fullName;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim().split(/\s+/)[0];
  }
  return 'EcoGifts customer';
}
