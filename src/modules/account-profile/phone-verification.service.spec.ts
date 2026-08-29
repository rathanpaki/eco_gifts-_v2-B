jest.mock('../../auth/firebase-admin.service', () => ({
  FirebaseAdminService: class FirebaseAdminService {},
}));

import { BadRequestException } from '@nestjs/common';
import { PhoneVerificationService } from './phone-verification.service';

describe('PhoneVerificationService', () => {
  const phones = {
    request: jest.fn(),
    verify: jest.fn(),
  };
  const service = new PhoneVerificationService(phones as never);

  beforeEach(() => jest.resetAllMocks());

  it('requests a code for a normalized user-entered number', async () => {
    phones.request.mockResolvedValue(false);
    await expect(
      service.request('user-1', ' +94 77 123 4567 '),
    ).resolves.toEqual({
      phone: '+94 77 123 4567',
      alreadyVerified: false,
      expiresInSeconds: 600,
    });
  });

  it('accepts 123456 after an active matching request', async () => {
    phones.verify.mockResolvedValue(true);
    await expect(
      service.verify('user-1', '+94771234567', '123456'),
    ).resolves.toEqual({ phone: '+94771234567', verified: true });
  });

  it('rejects another code without touching the repository', async () => {
    await expect(
      service.verify('user-1', '+94771234567', '654321'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(phones.verify).not.toHaveBeenCalled();
  });
});
