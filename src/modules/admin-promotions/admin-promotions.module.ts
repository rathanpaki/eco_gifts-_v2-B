import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminPromotionsController } from './admin-promotions.controller';
import { PublicPromotionsController } from './public-promotions.controller';
import { AdminPromotionsRepository } from './admin-promotions.repository';
import { AdminPromotionsService } from './admin-promotions.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminPromotionsController, PublicPromotionsController],
  providers: [AdminPromotionsRepository, AdminPromotionsService],
  exports: [AdminPromotionsService],
})
export class AdminPromotionsModule {}
