import { BadRequestException, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { EnvironmentConfig } from '../../config/environment.config';
import { AdminPromotionsService } from '../admin-promotions/admin-promotions.service';
import { AdminSettingsService } from '../admin-settings/admin-settings.service';
import { CartService } from '../cart/cart.service';
import { EcoContributionService } from '../eco-contribution/eco-contribution.service';
import type { Order } from '../orders/order.types';
import { buildCheckoutQuote } from './checkout.policy';
import { CheckoutRepository } from './checkout.repository';
import type { CheckoutQuote, CheckoutSelection } from './checkout.types';
import type { PlaceOrderDto } from './dto/place-order.dto';
import { assertStorefrontActive } from './checkout-operations.policy';
import { assertCheckoutPaymentEnabled } from './checkout-payment.policy';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly carts: CartService,
    private readonly checkout: CheckoutRepository,
    private readonly environment: EnvironmentConfig,
    private readonly contributions: EcoContributionService,
    private readonly promotions: AdminPromotionsService,
    private readonly settings: AdminSettingsService,
  ) {}

  async quote(
    user: AuthenticatedUser,
    request: Request,
    response: Response,
    selection: CheckoutSelection,
  ): Promise<CheckoutQuote> {
    validateDiscountChoice(selection);
    const settings = await this.settings.get();
    assertStorefrontActive(settings);
    const cart = await this.carts.get(request, response);
    const discount = selection.voucherId
      ? await this.contributions.getVoucherDiscount(
          user.uid,
          selection.voucherId,
        )
      : null;
    const promotion = selection.promoCode
      ? await this.promotions.findActiveByCode(selection.promoCode)
      : null;
    return buildCheckoutQuote(cart, selection, discount, promotion, settings);
  }

  async place(
    user: AuthenticatedUser,
    request: Request,
    response: Response,
    input: PlaceOrderDto,
  ): Promise<Order> {
    validateDiscountChoice(input);
    assertCheckoutPaymentEnabled(
      input.paymentMethod,
      this.environment.demoCardPaymentsEnabled,
    );
    await this.carts.get(request, response);
    return this.checkout.place(user, input);
  }
}
function validateDiscountChoice(selection: CheckoutSelection) {
  if (selection.voucherId && selection.promoCode)
    throw new BadRequestException(
      'Choose either a reward voucher or a promotion code.',
    );
}
