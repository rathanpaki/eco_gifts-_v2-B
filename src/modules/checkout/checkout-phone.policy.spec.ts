import { BadRequestException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { assertCheckoutPhoneVerified } from './checkout-phone.policy';

function snapshot(values: Record<string, unknown>) {
  return {
    get: (field: string) => values[field],
  } as FirebaseFirestore.DocumentSnapshot;
}

describe('assertCheckoutPhoneVerified', () => {
  it('accepts the verified saved number with harmless formatting changes', () => {
    expect(() =>
      assertCheckoutPhoneVerified(
        snapshot({
          phone: '+94 77 123 4567',
          phoneVerifiedAt: Timestamp.now(),
        }),
        '+94 (77) 123-4567',
      ),
    ).not.toThrow();
  });

  it.each([
    [{ phone: '+94771234567' }, '+94771234567'],
    [
      { phone: '+94771234567', phoneVerifiedAt: Timestamp.now() },
      '+94770000000',
    ],
  ])('rejects an unverified or changed number', (profile, phone) => {
    expect(() => assertCheckoutPhoneVerified(snapshot(profile), phone)).toThrow(
      BadRequestException,
    );
  });
});
