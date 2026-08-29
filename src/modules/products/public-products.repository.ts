import { Injectable } from '@nestjs/common';
import {
  FieldPath,
  type DocumentData,
  type OrderByDirection,
  type Query,
} from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { ProductStatus } from '../admin-products/product-status.enum';
import {
  decodeProductCursor,
  encodeProductCursor,
} from './public-product.cursor';
import type {
  PublicProductDocument,
  PublicProductDocumentPage,
  PublicProductListInput,
  PublicProductSort,
} from './product.types';

@Injectable()
export class PublicProductsRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async list(
    input: PublicProductListInput,
  ): Promise<PublicProductDocumentPage> {
    let query: Query = this.firebase.firestore
      .collection('products')
      .where('status', '==', ProductStatus.ACTIVE);
    if (input.category) query = query.where('category', '==', input.category);
    if (input.occasion) {
      query = query.where('occasions', 'array-contains', input.occasion);
    }
    if (input.personalizable !== undefined) {
      query = query.where(
        'personalizationAvailable',
        '==',
        input.personalizable,
      );
    }
    if (input.searchTokens.length) {
      query = query.where(
        'searchTerms',
        'array-contains-any',
        input.searchTokens,
      );
    }
    if (input.minPriceCents !== undefined) {
      query = query.where('priceCents', '>=', input.minPriceCents);
    }
    if (input.maxPriceCents !== undefined) {
      query = query.where('priceCents', '<=', input.maxPriceCents);
    }
    if (input.sort === 'featured') {
      query = query.where('featuredRank', '>=', 0);
    }
    const totalItems = (await query.count().get()).data().count;
    const totalPages = Math.ceil(totalItems / input.limit);
    const page = totalPages ? Math.min(input.page, totalPages) : 1;
    const order = sortOrder(input.sort);
    query = query
      .orderBy(order.field, order.direction)
      .orderBy(FieldPath.documentId(), order.direction);
    if (input.cursor) {
      query = query.startAfter(
        ...decodeProductCursor(input.cursor, input.sort),
      );
    } else if (page > 1) {
      query = query.offset((page - 1) * input.limit);
    }
    const snapshot = await query.limit(input.limit + 1).get();
    const hasMore = snapshot.docs.length > input.limit;
    const docs = snapshot.docs.slice(0, input.limit);
    const last = docs.at(-1);
    return {
      docs: docs.map(toDocument),
      nextCursor:
        hasMore && last
          ? encodeProductCursor(last.id, last.data(), input.sort)
          : null,
      page,
      pageSize: input.limit,
      totalItems,
      totalPages,
    };
  }

  async findBySlug(slug: string): Promise<PublicProductDocument | null> {
    const snapshot = await this.firebase.firestore
      .collection('products')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    const document = snapshot.docs[0];
    if (!document || document.data().status !== ProductStatus.ACTIVE) {
      return null;
    }
    return toDocument(document);
  }
}

function sortOrder(sort: PublicProductSort): SortOrder {
  if (sort === 'newest') return { field: 'updatedAt', direction: 'desc' };
  if (sort === 'price-desc') return { field: 'priceCents', direction: 'desc' };
  if (sort === 'price-asc') return { field: 'priceCents', direction: 'asc' };
  if (sort === 'name-asc') return { field: 'name', direction: 'asc' };
  return { field: 'featuredRank', direction: 'asc' };
}

function toDocument(document: {
  id: string;
  data(): DocumentData;
}): PublicProductDocument {
  return { id: document.id, data: document.data() };
}

interface SortOrder {
  field: string;
  direction: OrderByDirection;
}
