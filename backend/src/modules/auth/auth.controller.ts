import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { SocialAuthService } from './services/social-auth.service';
import type { SocialProvider } from './types/social-auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly socialAuthService: SocialAuthService,
  ) {}

  @Get(':provider')
  async redirectToProvider(
    @Param('provider') providerParam: string,
    @Res() res: Response,
    @Query('redirect') redirect?: string,
  ) {
    const provider = this.parseProvider(providerParam);
    const authRequest = await this.socialAuthService.createAuthorizationRequest(
      provider,
      redirect,
    );

    res.cookie(authRequest.cookieName, authRequest.stateToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: authRequest.maxAge,
      path: '/api/auth',
    });

    return res.redirect(authRequest.authorizationUrl);
  }

  @Get(':provider/callback')
  async handleSocialCallback(
    @Param('provider') providerParam: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    const provider = this.parseProvider(providerParam);
    const cookieName = this.socialAuthService.getStateCookieName(provider);
    const cookieState = this.readCookie(req.headers.cookie, cookieName);
    const frontendSuccessUrl = process.env.SOCIAL_AUTH_SUCCESS_URL
      ? process.env.SOCIAL_AUTH_SUCCESS_URL
      : 'http://localhost:3001/auth/social/callback';
    const frontendFailureUrl = process.env.SOCIAL_AUTH_FAILURE_URL
      ? process.env.SOCIAL_AUTH_FAILURE_URL
      : 'http://localhost:3001/login?error=social_auth_failed';

    res.clearCookie(cookieName, {
      path: '/api/auth',
    });

    let redirect: string | undefined;

    try {
      redirect = await this.socialAuthService.validateCallbackState(
        provider,
        state,
        cookieState,
      );

      if (error) {
        return res.redirect(
          this.buildFrontendFailureUrl(frontendFailureUrl, error, redirect),
        );
      }

      if (!code) {
        return res.redirect(
          this.buildFrontendFailureUrl(
            frontendFailureUrl,
            'OAuth provider did not return an authorization code.',
            redirect,
          ),
        );
      }

      const session = await this.socialAuthService.authenticateWithCode(
        provider,
        code,
      );
      const params = new URLSearchParams({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        redirect,
      });

      return res.redirect(
        `${frontendSuccessUrl.replace(/\/$/, '')}?${params.toString()}`,
      );
    } catch (callbackError) {
      const message =
        callbackError instanceof Error
          ? callbackError.message
          : 'Social authentication failed.';

      return res.redirect(
        this.buildFrontendFailureUrl(frontendFailureUrl, message, redirect),
      );
    }
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('send-verification')
  sendVerification(@Body() dto: SendVerificationDto) {
    return this.authService.sendVerification(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('password/forgot')
  forgotPasswordV2(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('password/verify-token')
  verifyResetToken(@Body() dto: VerifyResetTokenDto) {
    return this.authService.verifyResetToken(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('password/reset')
  resetPasswordV2(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  private buildFrontendFailureUrl(
    baseUrl: string,
    detail: string,
    redirect?: string,
  ) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    const redirectParam = redirect
      ? `&redirect=${encodeURIComponent(redirect)}`
      : '';
    return `${baseUrl}${separator}detail=${encodeURIComponent(detail)}${redirectParam}`;
  }
  private readCookie(cookieHeader: string | undefined, name: string) {
    if (!cookieHeader) {
      return null;
    }

    const cookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));

    if (!cookie) {
      return null;
    }

    return decodeURIComponent(cookie.slice(name.length + 1));
  }

  private parseProvider(provider: string): SocialProvider {
    if (provider === 'google' || provider === 'github') {
      return provider;
    }

    throw new NotFoundException('Social provider not found.');
  }
}
