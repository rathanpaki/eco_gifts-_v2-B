import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { RequestPhoneVerificationDto } from './dto/request-phone-verification.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { PhoneVerificationService } from './phone-verification.service';

@Controller('account/phone')
@UseGuards(SessionAuthGuard, CsrfGuard)
export class AccountPhoneController {
  constructor(private readonly verification: PhoneVerificationService) {}

  @Post('request-verification')
  request(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RequestPhoneVerificationDto,
  ) {
    return this.verification.request(user.uid, body.phone);
  }

  @Post('verify')
  verify(@CurrentUser() user: AuthenticatedUser, @Body() body: VerifyPhoneDto) {
    return this.verification.verify(user.uid, body.phone, body.code);
  }
}
