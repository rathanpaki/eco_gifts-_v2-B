import { BadRequestException, Injectable } from '@nestjs/common';
import { PhoneVerificationRepository } from './phone-verification.repository';

const DEVELOPMENT_OTP = '123456';
const OTP_LIFETIME_MS = 10 * 60 * 1000;

@Injectable()
export class PhoneVerificationService {
  constructor(private readonly phones: PhoneVerificationRepository) {}

  async request(userId: string, value: string) {
    const phone = value.trim();
    const alreadyVerified = await this.phones.request(userId, phone);
    return { phone, alreadyVerified, expiresInSeconds: 600 };
  }

  async verify(userId: string, value: string, code: string) {
    const phone = value.trim();
    if (code !== DEVELOPMENT_OTP) {
      throw new BadRequestException('The verification code is incorrect.');
    }
    const verified = await this.phones.verify(userId, phone, OTP_LIFETIME_MS);
    if (!verified) {
      throw new BadRequestException(
        'Request a new verification code for this phone number.',
      );
    }
    return { phone, verified: true };
  }
}
