import { BadRequestException, Injectable } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { FirebaseAdminService } from './firebase-admin.service';
import { normalizedClaims, Role } from './role.enum';

@Injectable()
export class RoleAdminService {
  constructor(private readonly firebase: FirebaseAdminService) {}

  async updateRole(input: RoleUpdate): Promise<void> {
    if (input.actorUid === input.targetUid && input.role !== Role.ADMIN) {
      throw new BadRequestException(
        'An admin cannot remove their own administrator access.',
      );
    }
    const target = await this.firebase.auth.getUser(input.targetUid);
    await this.firebase.auth.setCustomUserClaims(
      input.targetUid,
      normalizedClaims(target.customClaims ?? {}, input.role),
    );
    const batch = this.firebase.firestore.batch();
    batch.set(
      this.firebase.firestore.collection('users').doc(input.targetUid),
      {
        role: input.role,
        roles: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    batch.create(this.firebase.firestore.collection('auditLogs').doc(), {
      action: 'user.role.updated',
      actorUid: input.actorUid,
      targetUid: input.targetUid,
      role: input.role,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
  }
}

interface RoleUpdate {
  actorUid: string;
  targetUid: string;
  role: Role;
}
