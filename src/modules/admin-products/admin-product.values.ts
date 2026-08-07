import { FieldValue } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import type { ProductWriteInput } from './admin-product.types';
import { evidenceComplete, searchTerms } from './admin-product.utils';

export function productValues(input: ProductWriteInput) {
  return {
    ...input,
    name: input.name.trim(),
    shortDescription: input.shortDescription.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    sku: input.sku.trim().toUpperCase(),
    currency: input.currency.toUpperCase(),
    lowStock: input.stockQuantity <= input.lowStockThreshold,
    ecoEvidence: {
      materialsVerified: input.materialsVerified,
      packagingVerified: input.packagingVerified,
      contributionVerified: input.contributionVerified,
    },
    ecoEvidenceComplete: evidenceComplete(input),
    searchTerms: searchTerms(input),
  };
}

export function productAudit(
  action: string,
  actor: AuthenticatedUser,
  productId: string,
) {
  return {
    action,
    actorUid: actor.uid,
    productId,
    createdAt: FieldValue.serverTimestamp(),
  };
}
