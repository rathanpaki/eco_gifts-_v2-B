import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { EnvironmentConfig } from '../../config/environment.config';
import { CsrfGuard } from './csrf.guard';

describe('CsrfGuard', () => {
  const config = new EnvironmentConfig();
  const guard = new CsrfGuard(config);

  it('accepts matching cookie and header tokens', () => {
    expect(guard.canActivate(context('secure-token', 'secure-token'))).toBe(
      true,
    );
  });

  it('rejects missing or mismatched tokens', () => {
    expect(() => guard.canActivate(context('secure-token', 'other'))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(context(undefined, undefined))).toThrow(
      ForbiddenException,
    );
  });
});

function context(
  cookie: string | undefined,
  header: string | undefined,
): ExecutionContext {
  const request = {
    cookies: cookie ? { [new EnvironmentConfig().csrfCookieName]: cookie } : {},
    get: (name: string) =>
      name.toLowerCase() === 'x-csrf-token' ? header : undefined,
  } as Partial<Request>;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}
