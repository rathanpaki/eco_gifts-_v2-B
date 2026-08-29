import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AccountNotificationFeed } from './account-notification.types';
import { AccountNotificationsService } from './account-notifications.service';

@Controller('account/notifications')
@UseGuards(SessionAuthGuard)
export class AccountNotificationsController {
  constructor(private readonly notifications: AccountNotificationsService) {}

  @Get()
  feed(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AccountNotificationFeed> {
    return this.notifications.feed(user.uid);
  }

  @Post('read-all')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.notifications.markAllRead(user.uid);
  }
}
