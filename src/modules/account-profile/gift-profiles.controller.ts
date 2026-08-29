import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { GiftProfile } from './account-saved.types';
import { GiftProfilesService } from './gift-profiles.service';
import { SavedItemParamsDto } from './dto/saved-item-params.dto';
import { WriteGiftProfileDto } from './dto/write-gift-profile.dto';

@Controller('account/gift-profiles')
@UseGuards(SessionAuthGuard)
export class GiftProfilesController {
  constructor(private readonly profiles: GiftProfilesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<GiftProfile[]> {
    return this.profiles.list(user.uid);
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: WriteGiftProfileDto,
  ): Promise<GiftProfile> {
    return this.profiles.create(user.uid, body);
  }

  @Put(':itemId')
  @UseGuards(CsrfGuard)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: SavedItemParamsDto,
    @Body() body: WriteGiftProfileDto,
  ): Promise<GiftProfile> {
    return this.profiles.update(user.uid, params.itemId, body);
  }

  @Delete(':itemId')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: SavedItemParamsDto,
  ): Promise<void> {
    return this.profiles.remove(user.uid, params.itemId);
  }
}
