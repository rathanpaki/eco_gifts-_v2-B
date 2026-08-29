import type { Timestamp } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { contributionDocuments } from '../eco-contribution/contribution.values';
import type { CheckoutQuote } from './checkout.types';

export function checkoutContributionRecords(
  quote: CheckoutQuote,
  user: AuthenticatedUser,
  orderId: string,
  createdAt: Timestamp,
) {
  return quote.ecoContribution
    ? contributionDocuments({
        userId: user.uid,
        orderId,
        selection: {
          cause: quote.ecoContribution.cause,
          amountCents: quote.ecoContribution.amountCents,
        },
        createdAt,
        customer: { name: user.displayName, email: user.email },
      })
    : null;
}
