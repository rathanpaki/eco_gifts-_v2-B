import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { VerifyImpactInput } from './admin-impact.types';

@Injectable()
export class AdminImpactRepository {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async documents(limit = 500) {
    const snapshot = await this.contributions()
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map((document) => document.data());
  }

  async document(id: string) {
    const snapshot = await this.contributions().doc(id).get();
    return snapshot.exists ? (snapshot.data() ?? null) : null;
  }

  async verify(
    id: string,
    input: VerifyImpactInput,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const contributionRef = this.contributions().doc(id);
    const auditRef = this.firebase.firestore.collection('impactAudit').doc();
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const contribution = await transaction.get(contributionRef);
      if (!contribution.exists) {
        throw new NotFoundException('Eco-contribution not found.');
      }
      const data = contribution.data() ?? {};
      if (data.status === 'verified') {
        throw new ConflictException('Eco-contribution is already verified.');
      }
      const treeId = typeof data.treeId === 'string' ? data.treeId : null;
      const treeRef = treeId ? this.treeRecords().doc(treeId) : null;
      const tree = treeRef ? await transaction.get(treeRef) : null;
      if (treeRef && !tree?.exists) {
        throw new NotFoundException('Tree record not found.');
      }
      if (treeRef) this.assertTreeEvidence(input);
      const verifiedAt = Timestamp.now();
      transaction.update(contributionRef, {
        status: 'verified',
        verifiedAt,
        verifiedBy: actor.uid,
      });
      if (treeRef) {
        transaction.update(treeRef, {
          status: 'verified',
          partnerName: input.partnerName?.trim(),
          partnerLocation: input.partnerLocation?.trim(),
          plantedDate: Timestamp.fromDate(
            new Date(input.plantedDate as string),
          ),
          certificateUrl: input.certificateUrl?.trim() || null,
          co2SequestrationKg: input.co2SequestrationKg,
          verifiedAt,
          verifiedBy: actor.uid,
        });
      }
      transaction.create(auditRef, {
        contributionId: id,
        treeId,
        action: 'verified',
        actorId: actor.uid,
        actorEmail: actor.email,
        createdAt: verifiedAt,
      });
    });
  }

  private assertTreeEvidence(input: VerifyImpactInput): void {
    if (
      !input.partnerName?.trim() ||
      !input.partnerLocation?.trim() ||
      !input.plantedDate ||
      input.co2SequestrationKg === undefined
    ) {
      throw new BadRequestException(
        'Tree verification requires partner, location, planting date, and CO2 impact.',
      );
    }
  }

  private contributions() {
    return this.firebase.firestore.collection('ecoContributions');
  }

  private treeRecords() {
    return this.firebase.firestore.collection('treeRecords');
  }
}
