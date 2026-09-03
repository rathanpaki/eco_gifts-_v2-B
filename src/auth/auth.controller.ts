import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Response } from 'express';
import { EnvironmentConfig } from '../config/environment.config';
import { CurrentUser } from './current-user.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { CsrfGuard } from './guards/csrf.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { SessionService } from './session.service';
import type { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: EnvironmentConfig,
    private readonly sessions: SessionService,
  ) {}

  @Get('csrf')
  csrf(@Res({ passthrough: true }) response: Response): { csrfToken: string } {
    const csrfToken = randomBytes(32).toString('base64url');
    response.cookie(
      this.config.csrfCookieName,
      csrfToken,
      this.config.csrfCookieOptions(),
    );
    return { csrfToken };
  }

  @Post('session')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async createSession(
    @Body() body: CreateSessionDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: SessionUser }> {
    const result = await this.sessions.create(
      body.idToken,
      body.marketingOptIn,
      body.rememberMe,
    );
    const cookieOptions = this.config.sessionCookieOptions();
    if (result.rememberMe) cookieOptions.maxAge = result.expiresIn;
    else delete cookieOptions.maxAge;
    response.cookie(
      this.config.sessionCookieName,
      result.sessionCookie,
      cookieOptions,
    );
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(
      this.config.sessionCookieName,
      this.config.sessionCookieOptions(),
    );
    response.clearCookie(
      this.config.csrfCookieName,
      this.config.csrfCookieOptions(),
    );
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): { user: SessionUser } {
    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    };
  }
}

interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  role: AuthenticatedUser['role'];
}
