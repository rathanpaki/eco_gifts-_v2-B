import {
  Body,
  Controller,
  HttpCode,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AdminGuard } from './guards/admin.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { RoleAdminService } from './role-admin.service';
import type { AuthenticatedUser } from './auth.types';

@Controller('admin/users')
@UseGuards(SessionAuthGuard, CsrfGuard, AdminGuard)
export class RoleAdminController {
  constructor(private readonly roleAdmin: RoleAdminService) {}

  @Patch(':uid/role')
  @HttpCode(204)
  async updateRoles(
    @Param('uid') uid: string,
    @Body() body: UpdateRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    await this.roleAdmin.updateRole({
      actorUid: actor.uid,
      targetUid: uid,
      role: body.role,
    });
  }
}
