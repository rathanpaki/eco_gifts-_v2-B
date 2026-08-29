import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { SavedPaymentMethod } from './account-saved.types';
import { SavedItemParamsDto } from './dto/saved-item-params.dto';
import { WritePaymentMethodDto } from './dto/write-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

@Controller('account/payment-methods')
@UseGuards(SessionAuthGuard)
export class PaymentMethodsController {
  constructor(private readonly methods: PaymentMethodsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<SavedPaymentMethod[]> {
    return this.methods.list(user.uid);
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: WritePaymentMethodDto,
  ): Promise<SavedPaymentMethod> {
    return this.methods.create(user.uid, body);
  }

  @Delete(':itemId')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: SavedItemParamsDto,
  ): Promise<void> {
    return this.methods.remove(user.uid, params.itemId);
  }
}
