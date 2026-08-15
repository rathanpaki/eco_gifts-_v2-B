jest.mock('../../auth/firebase-admin.service', () => ({
  FirebaseAdminService: class FirebaseAdminService {},
}));

import type { Request, Response } from 'express';
import type { FirebaseAdminService } from '../../auth/firebase-admin.service';
import type { EnvironmentConfig } from '../../config/environment.config';
import { CartIdentityService } from './cart-identity.service';

describe('CartIdentityService', () => {
  const verifySessionCookie = jest.fn();
  const firebase = {
    auth: { verifySessionCookie },
  } as unknown as FirebaseAdminService;
  const options = { httpOnly: true, sameSite: 'lax' as const, path: '/' };
  const config = {
    cartCookieName: 'eco_cart',
    sessionCookieName: 'session',
    cartCookieOptions: () => options,
  } as EnvironmentConfig;
  const service = new CartIdentityService(firebase, config);

  beforeEach(() => verifySessionCookie.mockReset());

  it('issues an opaque guest cookie and a hashed document identity', async () => {
    const cookie = jest.fn();
    const identity = await service.resolve(
      { cookies: {} } as Request,
      { cookie } as unknown as Response,
    );

    expect(cookie).toHaveBeenCalledWith(
      'eco_cart',
      expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      options,
    );
    expect(identity.ownerType).toBe('guest');
    expect(identity.ownerId).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(identity.cartId).toBe(`guest_${identity.ownerId}`);
  });

  it('selects the user cart and retains a guest cart for merging', async () => {
    verifySessionCookie.mockResolvedValue({ uid: 'user-1' });
    const guestToken = 'a'.repeat(43);
    const identity = await service.resolve(
      {
        cookies: { session: 'valid', eco_cart: guestToken },
      } as unknown as Request,
      {} as Response,
    );

    expect(identity).toMatchObject({ ownerType: 'user', ownerId: 'user-1' });
    expect(identity.guestCartId).toMatch(/^guest_/);
  });
});
