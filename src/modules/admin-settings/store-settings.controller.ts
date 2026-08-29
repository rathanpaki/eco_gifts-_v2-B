import { Controller, Get } from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service';

@Controller('store/settings')
export class StoreSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  async get() {
    const settings = await this.settings.get();
    return {
      storeName: settings.storeName,
      supportEmail: settings.supportEmail,
      storefrontActive: settings.storefrontActive,
    };
  }
}
