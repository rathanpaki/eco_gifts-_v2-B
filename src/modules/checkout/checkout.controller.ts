import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/auth.types';
import type { Order } from '../orders/order.types';
import { CheckoutService } from './checkout.service';
import type { CheckoutQuote } from './checkout.types';
import { CheckoutSelectionDto } from './dto/checkout-selection.dto';
import { PlaceOrderDto } from './dto/place-order.dto';

@Controller('checkout')
@UseGuards(SessionAuthGuard)
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Get('quote')
  quote(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Query() query: CheckoutSelectionDto,
  ): Promise<CheckoutQuote> {
    return this.checkout.quote(request, response, query);
  }

  @Post('orders')
  @UseGuards(CsrfGuard)
  place(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: PlaceOrderDto,
  ): Promise<Order> {
    return this.checkout.place(user, request, response, body);
  }
}
