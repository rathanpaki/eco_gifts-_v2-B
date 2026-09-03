import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { EnvironmentConfig } from '../config/environment.config';
import { FirebaseAdminService } from './firebase-admin.service';
import { normalizedClaims, Role, roleFromClaims } from './role.enum';
import { customerSearchTerms } from './user-profile.values';
import { adminSettingsFrom } from '../modules/admin-settings/admin-settings.values';

@Injectable()
export class SessionService {
  constructor(
    private readonly firebase: FirebaseAdminService,
    private readonly config: EnvironmentConfig,
  ) {}

  async create(
    idToken: string,
    marketingOptIn?: boolean,
    rememberMe = false,
  ): Promise<SessionResult> {
    const token = await this.firebase.auth.verifyIdToken(idToken, true);
    if (Date.now() / 1000 - token.auth_time > 5 * 60) {
      throw new UnauthorizedException('Recent sign-in is required.');
    }
    const user = await this.firebase.auth.getUser(token.uid);
    const role = await this.ensureRole(user.uid, user.customClaims ?? {});
    const expiresIn =
      role === Role.ADMIN && !rememberMe
        ? await this.adminSessionTtl()
        : this.config.sessionTtlMilliseconds;
    await this.ensureProfile({
      uid: user.uid,
      email: user.email ?? token.email ?? null,
      displayName: user.displayName ?? null,
      emailVerified: user.emailVerified,
      role,
      marketingOptIn,
    });
    const sessionCookie = await this.firebase.auth.createSessionCookie(
      idToken,
      {
        expiresIn,
      },
    );
    return {
      sessionCookie,
      expiresIn,
      rememberMe,
      user: {
        uid: user.uid,
        displayName: user.displayName ?? null,
        email: user.email ?? token.email ?? null,
        emailVerified: user.emailVerified,
        role,
      },
    };
  }

  private async adminSessionTtl(): Promise<number> {
    const snapshot = await this.firebase.firestore
      .collection('settings')
      .doc('store')
      .get();
    const minutes = adminSettingsFrom(snapshot.data()).sessionTimeoutMinutes;
    return Math.min(minutes * 60_000, this.config.sessionTtlMilliseconds);
  }

  private async ensureRole(
    uid: string,
    claims: Record<string, unknown>,
  ): Promise<Role> {
    const role = roleFromClaims(claims);
    if (!role && ('role' in claims || 'roles' in claims)) {
      throw new ForbiddenException('The account has invalid role claims.');
    }
    const resolved = role ?? Role.USER;
    if (claims.role !== resolved || 'roles' in claims) {
      await this.firebase.auth.setCustomUserClaims(
        uid,
        normalizedClaims(claims, resolved),
      );
    }
    return resolved;
  }

  private async ensureProfile(profile: ProfileInput): Promise<void> {
    const profileRef = this.firebase.firestore
      .collection('users')
      .doc(profile.uid);
    const values = {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      emailVerified: profile.emailVerified,
      searchTerms: customerSearchTerms(profile.displayName, profile.email),
      updatedAt: FieldValue.serverTimestamp(),
      ...(profile.marketingOptIn === undefined
        ? {}
        : {
            marketingOptIn: profile.marketingOptIn,
            marketingConsentUpdatedAt: FieldValue.serverTimestamp(),
          }),
    };
    await this.firebase.firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(profileRef);
      if (existing.exists) {
        transaction.set(
          profileRef,
          { ...values, roles: FieldValue.delete() },
          { merge: true },
        );
        return;
      }
      transaction.create(profileRef, {
        ...values,
        orderCount: 0,
        completedOrderCount: 0,
        lifetimeValueCents: 0,
        impactPlasticAvoidedGrams: 0,
        impactCo2SavedKg: 0,
        rewardPoints: 0,
        hasOrders: false,
        repeatCustomer: false,
        customerSegment: 'none',
        marketingOptIn: profile.marketingOptIn ?? false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  }
}

interface ProfileInput {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  role: Role;
  marketingOptIn?: boolean;
}

export interface SessionResult {
  sessionCookie: string;
  expiresIn: number;
  rememberMe: boolean;
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    emailVerified: boolean;
    role: Role;
  };
}
