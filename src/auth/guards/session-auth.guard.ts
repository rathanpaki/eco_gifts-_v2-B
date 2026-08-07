import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { EnvironmentConfig } from '../../config/environment.config';
import type { AuthenticatedUser } from '../auth.types';
import { FirebaseAdminService } from '../firebase-admin.service';
import { Role, roleFromClaims } from '../role.enum';

type SessionRequest = Request & { authUser?: AuthenticatedUser };

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly firebase: FirebaseAdminService,
    private readonly config: EnvironmentConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const cookies: unknown = request.cookies;
    const sessionCookie = this.cookieValue(cookies);
    if (typeof sessionCookie !== 'string') {
      throw new UnauthorizedException('A session cookie is required.');
    }

    try {
      const token = await this.firebase.auth.verifySessionCookie(
        sessionCookie,
        true,
      );
      const userRecord = await this.firebase.auth.getUser(token.uid);
      request.authUser = {
        uid: token.uid,
        email: token.email ?? userRecord.email ?? null,
        displayName: userRecord.displayName ?? null,
        emailVerified: token.email_verified ?? userRecord.emailVerified,
        role: roleFromClaims(userRecord.customClaims ?? {}) ?? Role.USER,
        token,
      };
      return true;
    } catch {
      throw new UnauthorizedException('The session is invalid or expired.');
    }
  }

  private cookieValue(cookies: unknown): unknown {
    if (typeof cookies !== 'object' || cookies === null) return undefined;
    return Reflect.get(cookies, this.config.sessionCookieName);
  }
}
