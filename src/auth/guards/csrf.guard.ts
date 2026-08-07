import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { EnvironmentConfig } from '../../config/environment.config';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: EnvironmentConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const cookies: unknown = request.cookies;
    const cookie = this.cookieValue(cookies);
    const header = request.get('x-csrf-token');
    if (!this.matches(cookie, header)) {
      throw new ForbiddenException('Invalid CSRF token.');
    }
    return true;
  }

  private matches(cookie: unknown, header: string | undefined): boolean {
    if (typeof cookie !== 'string' || !header) return false;
    const cookieValue = Buffer.from(cookie);
    const headerValue = Buffer.from(header);
    return (
      cookieValue.length === headerValue.length &&
      timingSafeEqual(cookieValue, headerValue)
    );
  }

  private cookieValue(cookies: unknown): unknown {
    if (typeof cookies !== 'object' || cookies === null) return undefined;
    return Reflect.get(cookies, this.config.csrfCookieName);
  }
}
