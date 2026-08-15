import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { FirebaseAdminService } from './firebase-admin.service';
import { CsrfGuard } from './guards/csrf.guard';
import { AdminGuard } from './guards/admin.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { SessionService } from './session.service';
import { RoleAdminController } from './role-admin.controller';
import { RoleAdminService } from './role-admin.service';

@Module({
  controllers: [AuthController, RoleAdminController],
  providers: [
    FirebaseAdminService,
    SessionService,
    CsrfGuard,
    SessionAuthGuard,
    AdminGuard,
    RoleAdminService,
  ],
  exports: [FirebaseAdminService, SessionAuthGuard, AdminGuard, CsrfGuard],
})
export class AuthModule {}
