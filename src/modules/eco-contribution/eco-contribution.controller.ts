import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { EcoImpactSummary, RewardVoucher } from './contribution.types';
import { EcoContributionService } from './eco-contribution.service';

@Controller('eco-contributions')
@UseGuards(SessionAuthGuard)
export class EcoContributionController {
  constructor(private readonly contributions: EcoContributionService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser): Promise<EcoImpactSummary> {
    return this.contributions.summary(user.uid);
  }

  @Post('redeem-voucher')
  @UseGuards(CsrfGuard)
  redeem(@CurrentUser() user: AuthenticatedUser): Promise<RewardVoucher> {
    return this.contributions.redeemRewardVoucher(user.uid);
  }
}
