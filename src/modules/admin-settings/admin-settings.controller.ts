import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AdminSettings } from './admin-settings.types';
import { AdminSettingsService } from './admin-settings.service';
import { UpdateAdminSettingsDto } from './dto/update-admin-settings.dto';

@Controller('admin/settings')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  get(): Promise<AdminSettings> {
    return this.settings.get();
  }

  @Put()
  @UseGuards(CsrfGuard)
  update(@Body() body: UpdateAdminSettingsDto): Promise<AdminSettings> {
    return this.settings.update(body);
  }
}
