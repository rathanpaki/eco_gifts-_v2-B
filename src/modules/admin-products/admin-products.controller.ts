import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AdminProductImagesService } from './admin-product-images.service';
import type { AdminProduct, AdminProductPage } from './admin-product.types';
import { AdminProductsService } from './admin-products.service';
import { ProductImageDto } from './dto/product-image.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { WriteProductDto } from './dto/write-product.dto';
import type { UploadedProductImage } from './product-image.service';

@Controller('admin/products')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminProductsController {
  constructor(
    private readonly products: AdminProductsService,
    private readonly images: AdminProductImagesService,
  ) {}

  @Get()
  list(@Query() query: ProductQueryDto): Promise<AdminProductPage> {
    return this.products.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<AdminProduct> {
    return this.products.get(id);
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @Body() body: WriteProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminProduct> {
    return this.products.create(body, actor);
  }

  @Put(':id')
  @UseGuards(CsrfGuard)
  update(
    @Param('id') id: string,
    @Body() body: WriteProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminProduct> {
    return this.products.update(id, body, actor);
  }

  @Post(':id/images')
  @UseGuards(CsrfGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { files: 1, fileSize: 5 * 1024 * 1024 },
    }),
  )
  addImage(
    @Param('id') id: string,
    @UploadedFile() file: UploadedProductImage | undefined,
    @Body() body: ProductImageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminProduct> {
    return this.images.add(id, file, body.alt, actor);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(CsrfGuard)
  removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminProduct> {
    return this.images.remove(id, imageId, actor);
  }

  @Put(':id/images/order')
  @UseGuards(CsrfGuard)
  reorderImages(
    @Param('id') id: string,
    @Body() body: ReorderImagesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminProduct> {
    return this.images.reorder(id, body.imageIds, actor);
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  @HttpCode(204)
  archive(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.products.archive(id, actor);
  }
}
