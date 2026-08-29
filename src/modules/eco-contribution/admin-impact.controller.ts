import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { AdminImpactService } from './admin-impact.service';
import type { AdminImpactItem, AdminImpactPage } from './admin-impact.types';
import { AdminImpactQueryDto } from './dto/admin-impact-query.dto';
import { ImpactParamsDto } from './dto/impact-params.dto';
import { VerifyImpactDto } from './dto/verify-impact.dto';

@Controller('admin/impact')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminImpactController {
  constructor(private readonly impact: AdminImpactService) {}

  @Get()
  list(@Query() query: AdminImpactQueryDto): Promise<AdminImpactPage> {
    return this.impact.list(query);
  }

  @Get(':contributionId')
  get(@Param() params: ImpactParamsDto): Promise<AdminImpactItem> {
    return this.impact.get(params.contributionId);
  }

  @Patch(':contributionId/verify')
  @UseGuards(CsrfGuard)
  verify(
    @Param() params: ImpactParamsDto,
    @Body() body: VerifyImpactDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminImpactItem> {
    return this.impact.verify(params.contributionId, body, actor);
  }
}
