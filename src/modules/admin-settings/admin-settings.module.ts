import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';
import { StoreSettingsController } from './store-settings.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminSettingsController, StoreSettingsController],
  providers: [AdminSettingsService],
  exports: [AdminSettingsService],
})
export class AdminSettingsModule {}
