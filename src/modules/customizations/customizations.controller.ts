import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/auth.types';
import type {
  Customization,
  UploadedCustomizationPreview,
} from './customization.types';
import { CUSTOMIZATION_PREVIEW_MAX_BYTES } from './customization-storage.service';
import { CustomizationsService } from './customizations.service';
import { CreateCustomizationDto } from './dto/create-customization.dto';
import { CustomizationParamsDto } from './dto/customization-params.dto';

@Controller('customizations')
@UseGuards(SessionAuthGuard)
export class CustomizationsController {
  constructor(private readonly customizations: CustomizationsService) {}

  @Post()
  @UseGuards(CsrfGuard)
  @UseInterceptors(
    FileInterceptor('preview', {
      limits: {
        files: 1,
        fileSize: CUSTOMIZATION_PREVIEW_MAX_BYTES,
        fields: 2,
      },
    }),
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedCustomizationPreview | undefined,
    @Body() body: CreateCustomizationDto,
  ): Promise<Customization> {
    return this.customizations.create(user, file, body);
  }

  @Patch(':customizationId')
  @UseGuards(CsrfGuard)
  @UseInterceptors(
    FileInterceptor('preview', {
      limits: {
        files: 1,
        fileSize: CUSTOMIZATION_PREVIEW_MAX_BYTES,
        fields: 2,
      },
    }),
  )
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: CustomizationParamsDto,
    @UploadedFile() file: UploadedCustomizationPreview | undefined,
    @Body() body: CreateCustomizationDto,
  ): Promise<Customization> {
    return this.customizations.update(
      user.uid,
      params.customizationId,
      file,
      body,
    );
  }

  @Get(':customizationId')
  find(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: CustomizationParamsDto,
  ): Promise<Customization> {
    return this.customizations.find(user.uid, params.customizationId);
  }

  @Get(':customizationId/preview')
  async preview(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: CustomizationParamsDto,
    @Res() response: Response,
  ): Promise<void> {
    const preview = await this.customizations.preview(
      user.uid,
      params.customizationId,
    );
    response.set({
      'Content-Type': 'image/png',
      'Content-Length': preview.length.toString(),
      'Cache-Control': 'private,no-store',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    response.send(preview);
  }
}
