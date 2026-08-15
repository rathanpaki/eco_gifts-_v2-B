import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CartIdentityService } from './cart-identity.service';
import { mapCart } from './cart.mapper';
import { CartMergeRepository } from './cart-merge.repository';
import { CartRepository } from './cart.repository';
import type { Cart, CartIdentity } from './cart.types';

@Injectable()
export class CartService {
  constructor(
    private readonly identities: CartIdentityService,
    private readonly carts: CartRepository,
    private readonly merges: CartMergeRepository,
  ) {}

  async get(request: Request, response: Response): Promise<Cart> {
    const identity = await this.identity(request, response);
    return this.load(identity.cartId);
  }

  async add(
    request: Request,
    response: Response,
    productId: string,
    quantity: number,
    customizationId?: string,
  ): Promise<Cart> {
    const identity = await this.identity(request, response);
    await this.carts.add(identity, productId, quantity, customizationId);
    return this.load(identity.cartId);
  }

  async setQuantity(
    request: Request,
    response: Response,
    itemId: string,
    quantity: number,
  ): Promise<Cart> {
    const identity = await this.identity(request, response);
    await this.carts.setQuantity(identity, itemId, quantity);
    return this.load(identity.cartId);
  }

  async remove(
    request: Request,
    response: Response,
    itemId: string,
  ): Promise<Cart> {
    const identity = await this.identity(request, response);
    await this.carts.remove(identity, itemId);
    return this.load(identity.cartId);
  }

  private async identity(
    request: Request,
    response: Response,
  ): Promise<CartIdentity> {
    const identity = await this.identities.resolve(request, response);
    if (identity.guestCartId) {
      await this.merges.mergeGuest(identity);
      this.identities.clearGuestCookie(response);
    }
    return identity;
  }

  private async load(cartId: string): Promise<Cart> {
    const stored = await this.carts.get(cartId);
    if (!stored) return mapCart(null, []);
    const products = await this.carts.getProducts([
      ...new Set(stored.items.map((item) => item.productId)),
    ]);
    return mapCart(stored, products);
  }
}
