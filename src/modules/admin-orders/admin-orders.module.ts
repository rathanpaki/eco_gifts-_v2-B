import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CustomizationsModule } from '../customizations/customizations.module';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersRepository } from './admin-orders.repository';
import { AdminOrdersService } from './admin-orders.service';

@Module({
  imports: [AuthModule, CustomizationsModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersRepository, AdminOrdersService],
})
export class AdminOrdersModule {}
