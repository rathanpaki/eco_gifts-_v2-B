import { Injectable } from '@nestjs/common';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CookieOptions } from 'express';

export type SameSite = 'lax' | 'strict' | 'none';

@Injectable()
export class EnvironmentConfig {
  readonly isProduction = process.env.NODE_ENV === 'production';
  readonly port = this.integer('PORT', 4000, 1, 65535);
  readonly frontendOrigins = this.origins();
  readonly sessionCookieName = this.value('SESSION_COOKIE_NAME', 'session');
  readonly csrfCookieName = this.value('CSRF_COOKIE_NAME', 'csrf');
  readonly cartCookieName = this.value('CART_COOKIE_NAME', 'eco_cart');
  readonly sessionTtlMilliseconds =
    this.integer('SESSION_DURATION_DAYS', 5, 1, 14) * 86_400_000;
  readonly cartTtlMilliseconds =
    this.integer('CART_DURATION_DAYS', 30, 1, 90) * 86_400_000;
  readonly cookieSecure = this.boolean('COOKIE_SECURE', this.isProduction);
  readonly cookieSameSite = this.sameSite();
  readonly cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;

  get firebaseServiceAccount(): FirebaseServiceAccount | undefined {
    const serialized = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
    if (!serialized) return undefined;

    try {
      const account: unknown = JSON.parse(serialized);
      if (!isServiceAccount(account)) {
        throw new Error('missing service-account fields');
      }
      return account;
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'invalid JSON';
      throw new Error(`FIREBASE_SERVICE_ACCOUNT is invalid: ${detail}`);
    }
  }

  get firebaseProjectId(): string | undefined {
    return process.env.FIREBASE_PROJECT_ID?.trim() || undefined;
  }

  get firebaseStorageBucket(): string | undefined {
    return process.env.FIREBASE_STORAGE_BUCKET?.trim() || undefined;
  }

  assertFirebaseCredentials(): void {
    if (this.firebaseServiceAccount) return;
    const rawCredentialPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    if (rawCredentialPath) {
      const credentialPath = resolve(process.cwd(), rawCredentialPath);
      if (!existsSync(credentialPath) || !statSync(credentialPath).isFile()) {
        throw new Error(
          `GOOGLE_APPLICATION_CREDENTIALS must reference an existing JSON file. Not found: ${credentialPath}`,
        );
      }
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
      return;
    }
    throw new Error(
      'Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS before starting the API.',
    );
  }

  sessionCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: this.cookieSameSite,
      domain: this.cookieDomain,
      path: '/',
      maxAge: this.sessionTtlMilliseconds,
    };
  }

  csrfCookieOptions(): CookieOptions {
    return {
      httpOnly: false,
      secure: this.cookieSecure,
      sameSite: this.cookieSameSite,
      domain: this.cookieDomain,
      path: '/',
      maxAge: this.sessionTtlMilliseconds,
    };
  }

  cartCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: this.cookieSameSite,
      domain: this.cookieDomain,
      path: '/',
      maxAge: this.cartTtlMilliseconds,
    };
  }

  private origins(): string[] {
    const source = process.env.FRONTEND_ORIGIN?.trim();
    if (!source && this.isProduction) {
      throw new Error('FRONTEND_ORIGIN is required in production.');
    }
    return (source || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  private value(name: string, fallback: string): string {
    return process.env[name]?.trim() || fallback;
  }

  private integer(
    name: string,
    fallback: number,
    min: number,
    max: number,
  ): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      throw new Error(`${name} must be an integer between ${min} and ${max}.`);
    }
    return parsed;
  }

  private boolean(name: string, fallback: boolean): boolean {
    const raw = process.env[name]?.trim().toLowerCase();
    if (!raw) return fallback;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    throw new Error(`${name} must be true or false.`);
  }

  private sameSite(): SameSite {
    const value = this.value('COOKIE_SAME_SITE', 'lax').toLowerCase();
    if (value !== 'lax' && value !== 'strict' && value !== 'none') {
      throw new Error('COOKIE_SAME_SITE must be lax, strict, or none.');
    }
    if (this.isProduction && !this.cookieSecure) {
      throw new Error('COOKIE_SECURE must be true in production.');
    }
    if (value === 'none' && !this.cookieSecure) {
      throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.');
    }
    return value;
  }
}

export interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function isServiceAccount(value: unknown): value is FirebaseServiceAccount {
  if (typeof value !== 'object' || value === null) return false;
  const account = value as Partial<FirebaseServiceAccount>;
  return Boolean(
    account.project_id && account.client_email && account.private_key,
  );
}
