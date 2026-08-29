import { Controller, Get } from '@nestjs/common';
import type { PublicPromotion } from './admin-promotion.types';
import { AdminPromotionsService } from './admin-promotions.service';

@Controller('promotions')
export class PublicPromotionsController {
  constructor(private readonly promotions: AdminPromotionsService) {}

  @Get('active')
  active(): Promise<PublicPromotion[]> {
    return this.promotions.active();
  }
}
