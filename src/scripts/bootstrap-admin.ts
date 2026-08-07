import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { FieldValue } from 'firebase-admin/firestore';
import { AppModule } from '../app.module';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { normalizedClaims, Role } from '../auth/role.enum';

async function bootstrapAdmin(): Promise<void> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error('BOOTSTRAP_ADMIN_EMAIL is required.');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const firebase = app.get(FirebaseAdminService);
    const user = await firebase.auth.getUserByEmail(email);
    await firebase.auth.setCustomUserClaims(
      user.uid,
      normalizedClaims(user.customClaims ?? {}, Role.ADMIN),
    );
    const batch = firebase.firestore.batch();
    batch.set(
      firebase.firestore.collection('users').doc(user.uid),
      {
        uid: user.uid,
        email: user.email ?? email,
        displayName: user.displayName ?? null,
        role: Role.ADMIN,
        roles: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    batch.create(firebase.firestore.collection('auditLogs').doc(), {
      action: 'user.admin.bootstrapped',
      actorUid: 'operator',
      targetUid: user.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    process.stdout.write(`Admin assigned to ${email}.\n`);
  } finally {
    await app.close();
  }
}

void bootstrapAdmin();
