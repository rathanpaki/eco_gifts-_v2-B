export interface ProductReview {
  id: string;
  productId: string;
  orderId: string;
  rating: number;
  title: string | null;
  comment: string;
  displayName: string;
  verifiedPurchase: true;
  createdAt: string;
}

export interface ProductReviewFeed {
  items: ProductReview[];
  averageRating: number;
  totalReviews: number;
}

export interface CreateProductReviewInput {
  orderId: string;
  productId: string;
  rating: number;
  title?: string;
  comment: string;
}
