import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminInventoryController } from './admin-inventory.controller';
import { AdminInventoryRepository } from './admin-inventory.repository';
import { AdminInventoryService } from './admin-inventory.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminInventoryController],
  providers: [AdminInventoryRepository, AdminInventoryService],
})
export class AdminInventoryModule {}
