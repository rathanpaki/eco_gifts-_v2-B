import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type {
  AdminPromotion,
  AdminPromotionPage,
} from './admin-promotion.types';
import { AdminPromotionsService } from './admin-promotions.service';
import { WritePromotionDto } from './dto/write-promotion.dto';
import { PromotionParamsDto } from './dto/promotion-params.dto';

@Controller('admin/promotions')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminPromotionsController {
  constructor(private readonly promotions: AdminPromotionsService) {}

  @Get()
  list(): Promise<AdminPromotionPage> {
    return this.promotions.list();
  }

  @Get(':promotionId')
  get(@Param() params: PromotionParamsDto): Promise<AdminPromotion> {
    return this.promotions.get(params.promotionId);
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(@Body() body: WritePromotionDto): Promise<AdminPromotion> {
    return this.promotions.create(body);
  }

  @Patch(':promotionId')
  @UseGuards(CsrfGuard)
  update(
    @Param() params: PromotionParamsDto,
    @Body() body: WritePromotionDto,
  ): Promise<AdminPromotion> {
    return this.promotions.update(params.promotionId, body);
  }

  @Delete(':promotionId')
  @UseGuards(CsrfGuard)
  @HttpCode(204)
  remove(@Param() params: PromotionParamsDto): Promise<void> {
    return this.promotions.remove(params.promotionId);
  }
}
