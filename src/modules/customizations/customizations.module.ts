import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CustomizationStorageService } from './customization-storage.service';
import { CustomizationsController } from './customizations.controller';
import { CustomizationsRepository } from './customizations.repository';
import { CustomizationsService } from './customizations.service';

@Module({
  imports: [AuthModule],
  controllers: [CustomizationsController],
  providers: [
    CustomizationsRepository,
    CustomizationStorageService,
    CustomizationsService,
  ],
})
export class CustomizationsModule {}
