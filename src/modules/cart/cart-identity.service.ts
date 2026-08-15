import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { FirebaseAdminService } from '../../auth/firebase-admin.service';
import { EnvironmentConfig } from '../../config/environment.config';
import type { CartIdentity } from './cart.types';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

@Injectable()
export class CartIdentityService {
  constructor(
    private readonly firebase: FirebaseAdminService,
    private readonly config: EnvironmentConfig,
  ) {}

  async resolve(request: Request, response: Response): Promise<CartIdentity> {
    const token = this.validGuestToken(
      this.cookie(request, this.config.cartCookieName),
    );
    const uid = await this.authenticatedUid(request);
    if (uid) {
      return {
        cartId: cartKey('user', uid),
        ownerId: uid,
        ownerType: 'user',
        ...(token ? { guestCartId: cartKey('guest', token) } : {}),
      };
    }

    const guestToken = token ?? randomBytes(32).toString('base64url');
    if (!token) {
      response.cookie(
        this.config.cartCookieName,
        guestToken,
        this.config.cartCookieOptions(),
      );
    }
    return {
      cartId: cartKey('guest', guestToken),
      ownerId: digest(guestToken),
      ownerType: 'guest',
    };
  }

  clearGuestCookie(response: Response): void {
    response.clearCookie(
      this.config.cartCookieName,
      this.config.cartCookieOptions(),
    );
  }

  private async authenticatedUid(request: Request): Promise<string | null> {
    const session = this.cookie(request, this.config.sessionCookieName);
    if (typeof session !== 'string') return null;
    try {
      return (await this.firebase.auth.verifySessionCookie(session, true)).uid;
    } catch {
      return null;
    }
  }

  private cookie(request: Request, name: string): unknown {
    const cookies: unknown = request.cookies;
    if (typeof cookies !== 'object' || cookies === null) return undefined;
    return Reflect.get(cookies, name);
  }

  private validGuestToken(value: unknown): string | null {
    return typeof value === 'string' && TOKEN_PATTERN.test(value)
      ? value
      : null;
  }
}

function cartKey(ownerType: 'guest' | 'user', value: string): string {
  return `${ownerType}_${digest(value)}`;
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}
