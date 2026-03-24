import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SocialProfile } from '../types/social-auth.types';

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleAuthService {
  constructor(private readonly configService: ConfigService) {}

  buildAuthorizationUrl(state: string) {
    const { clientId, callbackUrl } = this.getConfig();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async getProfileFromCode(code: string): Promise<SocialProfile> {
    const { clientId, clientSecret, callbackUrl } = this.getConfig();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    });

    const tokenPayload = await this.parseJson<GoogleTokenResponse>(
      tokenResponse,
      'Google token exchange failed.',
    );

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new UnauthorizedException(
        tokenPayload.error_description ??
          tokenPayload.error ??
          'Không thể xác thực với Google.',
      );
    }

    const profileResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
        },
      },
    );

    const profilePayload = await this.parseJson<GoogleUserInfoResponse>(
      profileResponse,
      'Google user info lookup failed.',
    );

    if (
      !profileResponse.ok ||
      !profilePayload.sub ||
      !profilePayload.email ||
      !profilePayload.email_verified
    ) {
      throw new UnauthorizedException(
        'Google account chưa cung cấp email đã xác minh.',
      );
    }

    return {
      provider: 'google',
      providerId: profilePayload.sub,
      email: profilePayload.email,
      emailVerified: true,
      displayName:
        profilePayload.name ?? profilePayload.email.split('@')[0] ?? 'Google User',
      avatarUrl: profilePayload.picture ?? null,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token ?? null,
      tokenExpiresAt: tokenPayload.expires_in
        ? new Date(Date.now() + tokenPayload.expires_in * 1000)
        : null,
      rawProfile: profilePayload as Record<string, unknown>,
    };
  }

  private getConfig() {
    const clientId = this.configService.get<string>('socialAuth.google.clientId');
    const clientSecret = this.configService.get<string>(
      'socialAuth.google.clientSecret',
    );
    const callbackUrl = this.configService.get<string>(
      'socialAuth.google.callbackUrl',
    );

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new InternalServerErrorException(
        'Google social login chưa được cấu hình đầy đủ.',
      );
    }

    return {
      clientId,
      clientSecret,
      callbackUrl,
    };
  }

  private async parseJson<T>(response: Response, fallbackMessage: string) {
    try {
      return (await response.json()) as T;
    } catch {
      throw new BadGatewayException(fallbackMessage);
    }
  }
}
