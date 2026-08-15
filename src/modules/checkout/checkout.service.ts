import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CartService } from '../cart/cart.service';
import type { Order } from '../orders/order.types';
import { buildCheckoutQuote } from './checkout.policy';
import { CheckoutRepository } from './checkout.repository';
import type { CheckoutQuote, CheckoutSelection } from './checkout.types';
import type { PlaceOrderDto } from './dto/place-order.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly carts: CartService,
    private readonly checkout: CheckoutRepository,
  ) {}

  async quote(
    request: Request,
    response: Response,
    selection: CheckoutSelection,
  ): Promise<CheckoutQuote> {
    const cart = await this.carts.get(request, response);
    return buildCheckoutQuote(cart, selection);
  }

  async place(
    user: AuthenticatedUser,
    request: Request,
    response: Response,
    input: PlaceOrderDto,
  ): Promise<Order> {
    await this.carts.get(request, response);
    return this.checkout.place(user, input);
  }
}
