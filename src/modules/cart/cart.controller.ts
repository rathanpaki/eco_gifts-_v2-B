import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { CartService } from './cart.service';
import type { Cart } from './cart.types';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartItemParamsDto } from './dto/cart-item-params.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly carts: CartService) {}

  @Get()
  get(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Cart> {
    return this.carts.get(request, response);
  }

  @Post('items')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  add(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: AddCartItemDto,
  ): Promise<Cart> {
    return this.carts.add(
      request,
      response,
      body.productId,
      body.quantity,
      body.customizationId,
    );
  }

  @Patch('items/:itemId')
  @UseGuards(CsrfGuard)
  update(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param() params: CartItemParamsDto,
    @Body() body: UpdateCartItemDto,
  ): Promise<Cart> {
    return this.carts.setQuantity(
      request,
      response,
      params.itemId,
      body.quantity,
    );
  }

  @Delete('items/:itemId')
  @UseGuards(CsrfGuard)
  remove(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param() params: CartItemParamsDto,
  ): Promise<Cart> {
    return this.carts.remove(request, response, params.itemId);
  }
}
