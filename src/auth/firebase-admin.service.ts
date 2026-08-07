import { Injectable } from '@nestjs/common';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { EnvironmentConfig } from '../config/environment.config';

@Injectable()
export class FirebaseAdminService {
  private appInstance?: App;

  constructor(private readonly config: EnvironmentConfig) {}

  get app(): App {
    if (!this.appInstance) {
      this.appInstance = this.initialize(this.config);
    }
    return this.appInstance;
  }

  get auth(): Auth {
    return getAuth(this.app);
  }

  get firestore(): Firestore {
    return getFirestore(this.app);
  }

  get storage(): Storage {
    return getStorage(this.app);
  }

  private initialize(config: EnvironmentConfig): App {
    const existing = getApps()[0];
    if (existing) return existing;

    config.assertFirebaseCredentials();
    const account = config.firebaseServiceAccount;
    const credential = account
      ? cert({
          projectId: account.project_id,
          clientEmail: account.client_email,
          privateKey: account.private_key,
        })
      : applicationDefault();
    return initializeApp({
      credential,
      projectId: account?.project_id ?? config.firebaseProjectId,
      storageBucket: config.firebaseStorageBucket,
    });
  }
}
