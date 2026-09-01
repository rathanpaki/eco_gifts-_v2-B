import { BadRequestException } from '@nestjs/common';
import { assertCheckoutPaymentEnabled } from './checkout-payment.policy';

describe('assertCheckoutPaymentEnabled', () => {
  it('always allows pay on delivery', () => {
    expect(() =>
      assertCheckoutPaymentEnabled('pay_on_delivery', false),
    ).not.toThrow();
  });

  it('allows demo card payment only when explicitly enabled', () => {
    expect(() => assertCheckoutPaymentEnabled('demo_card', true)).not.toThrow();
    expect(() => assertCheckoutPaymentEnabled('demo_card', false)).toThrow(
      BadRequestException,
    );
  });
});
