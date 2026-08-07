import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { FieldValue } from 'firebase-admin/firestore';
import { AppModule } from '../app.module';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { normalizedClaims, Role, roleFromClaims } from '../auth/role.enum';

async function migrateAccountRoles(): Promise<void> {
  if (process.env.CONFIRM_ROLE_MIGRATION !== 'eco-gifts-v2') {
    throw new Error('Set CONFIRM_ROLE_MIGRATION=eco-gifts-v2 to continue.');
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const firebase = app.get(FirebaseAdminService);
    let pageToken: string | undefined;
    let migrated = 0;
    do {
      const page = await firebase.auth.listUsers(500, pageToken);
      for (const user of page.users) {
        const claims = user.customClaims ?? {};
        const role = roleFromClaims(claims) ?? Role.USER;
        await firebase.auth.setCustomUserClaims(
          user.uid,
          normalizedClaims(claims, role),
        );
        await firebase.firestore
          .collection('users')
          .doc(user.uid)
          .set(
            {
              uid: user.uid,
              email: user.email ?? null,
              displayName: user.displayName ?? null,
              role,
              roles: FieldValue.delete(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        migrated += 1;
      }
      pageToken = page.pageToken;
    } while (pageToken);
    await firebase.firestore.collection('auditLogs').add({
      action: 'accounts.roles.migrated',
      migrated,
      createdAt: FieldValue.serverTimestamp(),
    });
    process.stdout.write(`Migrated ${migrated} accounts to USER/ADMIN.\n`);
  } finally {
    await app.close();
  }
}

void migrateAccountRoles();
