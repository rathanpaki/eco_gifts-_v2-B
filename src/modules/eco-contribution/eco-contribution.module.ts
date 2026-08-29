import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminImpactController } from './admin-impact.controller';
import { AdminImpactRepository } from './admin-impact.repository';
import { AdminImpactService } from './admin-impact.service';
import { EcoContributionController } from './eco-contribution.controller';
import { EcoContributionService } from './eco-contribution.service';

@Module({
  imports: [AuthModule],
  controllers: [EcoContributionController, AdminImpactController],
  providers: [
    EcoContributionService,
    AdminImpactRepository,
    AdminImpactService,
  ],
  exports: [EcoContributionService],
})
export class EcoContributionModule {}
