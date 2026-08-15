jest.mock('./cart-identity.service', () => ({
  CartIdentityService: class CartIdentityService {},
}));
jest.mock('./cart.repository', () => ({
  CartRepository: class CartRepository {},
}));
jest.mock('./cart-merge.repository', () => ({
  CartMergeRepository: class CartMergeRepository {},
}));

import type { Request, Response } from 'express';
import type { CartIdentityService } from './cart-identity.service';
import type { CartMergeRepository } from './cart-merge.repository';
import type { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

describe('CartService', () => {
  const identity = {
    cartId: 'user_cart',
    ownerId: 'user-1',
    ownerType: 'user' as const,
    guestCartId: 'guest_cart',
  };
  const add = jest.fn();
  const mergeGuest = jest.fn();
  const clearGuestCookie = jest.fn();
  const resolvedIdentities = {
    resolve: jest.fn().mockResolvedValue(identity),
    clearGuestCookie,
  } as unknown as CartIdentityService;
  const repository = {
    add,
    get: jest.fn().mockResolvedValue(null),
    getProducts: jest.fn(),
  } as unknown as CartRepository;
  const mergeRepository = {
    mergeGuest,
  } as unknown as CartMergeRepository;
  const service = new CartService(
    resolvedIdentities,
    repository,
    mergeRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('merges a guest cart before adding to the authenticated cart', async () => {
    const request = {} as Request;
    const response = {} as Response;
    const cart = await service.add(request, response, 'product-1', 1);

    expect(mergeGuest).toHaveBeenCalledWith(identity);
    expect(clearGuestCookie).toHaveBeenCalledWith(response);
    expect(add).toHaveBeenCalledWith(identity, 'product-1', 1, undefined);
    expect(cart.items).toEqual([]);
  });
});
