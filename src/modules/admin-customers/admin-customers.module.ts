import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminCustomersController } from './admin-customers.controller';
import { AdminCustomersRepository } from './admin-customers.repository';
import { AdminCustomersService } from './admin-customers.service';
import { CustomerMetricsRepository } from './customer-metrics.repository';
import { CustomerPrivacyRepository } from './customer-privacy.repository';

@Module({
  imports: [AuthModule],
  controllers: [AdminCustomersController],
  providers: [
    AdminCustomersRepository,
    AdminCustomersService,
    CustomerMetricsRepository,
    CustomerPrivacyRepository,
  ],
})
export class AdminCustomersModule {}
