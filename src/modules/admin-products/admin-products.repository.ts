import { BadRequestException, Injectable } from '@nestjs/common';
import {
  FieldPath,
  Timestamp,
  type DocumentData,
  type Query,
} from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { ProductFilter } from './dto/product-query.dto';
import { ProductStatus } from './product-status.enum';

@Injectable()
export class AdminProductsRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async list(input: ListQuery) {
    let query: Query = this.firebase.firestore.collection('products');
    if (input.filter === 'active') {
      query = query.where('status', '==', ProductStatus.ACTIVE);
    } else if (input.filter === 'draft') {
      query = query.where('status', '==', ProductStatus.DRAFT);
    } else if (input.filter === 'low-stock') {
      query = query.where('lowStock', '==', true);
    }
    const search = searchToken(input.search);
    if (search) query = query.where('searchTerms', 'array-contains', search);
    query = query
      .orderBy('updatedAt', 'desc')
      .orderBy(FieldPath.documentId(), 'desc');
    if (input.cursor) {
      const cursor = decodeCursor(input.cursor);
      query = query.startAfter(Timestamp.fromMillis(cursor.time), cursor.id);
    }
    const snapshot = await query.limit(input.limit + 1).get();
    const hasMore = snapshot.docs.length > input.limit;
    const docs = snapshot.docs.slice(0, input.limit);
    const last = docs.at(-1);
    return {
      docs: docs.map((doc) => ({ id: doc.id, data: doc.data() })),
      nextCursor: hasMore && last ? encodeCursor(last.id, last.data()) : null,
    };
  }

  async metrics() {
    const products = this.firebase.firestore.collection('products');
    const [active, drafts, lowStock, missing] = await Promise.all([
      products.where('status', '==', ProductStatus.ACTIVE).count().get(),
      products.where('status', '==', ProductStatus.DRAFT).count().get(),
      products.where('lowStock', '==', true).count().get(),
      products.where('ecoEvidenceComplete', '==', false).count().get(),
    ]);
    return {
      active: active.data().count,
      drafts: drafts.data().count,
      lowStock: lowStock.data().count,
      missingEcoEvidence: missing.data().count,
    };
  }

  async get(id: string) {
    const snapshot = await this.productRef(id).get();
    return snapshot.exists ? { id: snapshot.id, data: snapshot.data()! } : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const snapshot = await this.firebase.firestore
      .collection('products')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    return !snapshot.empty;
  }

  async skuOwner(sku: string): Promise<string | null> {
    const snapshot = await this.firebase.firestore
      .collection('products')
      .where('sku', '==', sku)
      .limit(1)
      .get();
    return snapshot.docs[0]?.id ?? null;
  }

  productRef(id: string) {
    return this.firebase.firestore.collection('products').doc(id);
  }

  newProductRef() {
    return this.firebase.firestore.collection('products').doc();
  }

  auditRef() {
    return this.firebase.firestore.collection('auditLogs').doc();
  }

  slugRef(slug: string) {
    return this.firebase.firestore.collection('productSlugs').doc(slug);
  }

  skuRef(sku: string) {
    return this.firebase.firestore.collection('productSkus').doc(sku);
  }

  get db() {
    return this.firebase.firestore;
  }
}

interface ListQuery {
  filter: ProductFilter;
  search?: string;
  cursor?: string;
  limit: number;
}

function searchToken(value?: string): string | null {
  return (
    value
      ?.trim()
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .find(Boolean) ?? null
  );
}

function encodeCursor(id: string, data: DocumentData): string {
  const updatedAt = (data as Record<string, unknown>).updatedAt;
  if (!(updatedAt instanceof Timestamp)) return '';
  return Buffer.from(`${updatedAt.toMillis()}:${id}`).toString('base64url');
}

function decodeCursor(value: string): { time: number; id: string } {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const separator = decoded.indexOf(':');
    const time = Number(decoded.slice(0, separator));
    const id = decoded.slice(separator + 1);
    if (!Number.isSafeInteger(time) || !id) throw new Error('invalid');
    return { time, id };
  } catch {
    throw new BadRequestException('The product cursor is invalid.');
  }
}
