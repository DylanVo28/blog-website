import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SocialProfile } from '../types/social-auth.types';

interface GitHubTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id?: number;
  login?: string;
  name?: string;
  email?: string | null;
  avatar_url?: string | null;
}

interface GitHubEmailResponse {
  email?: string;
  primary?: boolean;
  verified?: boolean;
}

@Injectable()
export class GitHubAuthService {
  constructor(private readonly configService: ConfigService) {}

  buildAuthorizationUrl(state: string, callbackUrl?: string) {
    const { clientId, callbackUrl: configuredCallbackUrl } = this.getConfig();
    const finalCallbackUrl = this.resolveCallbackUrl(
      callbackUrl,
      configuredCallbackUrl,
    );
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: finalCallbackUrl,
      scope: 'read:user user:email',
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async getProfileFromCode(
    code: string,
    callbackUrl?: string,
  ): Promise<SocialProfile> {
    const {
      clientId,
      clientSecret,
      callbackUrl: configuredCallbackUrl,
    } = this.getConfig();
    const finalCallbackUrl = this.resolveCallbackUrl(
      callbackUrl,
      configuredCallbackUrl,
    );
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: finalCallbackUrl,
        }),
      },
    );

    const tokenPayload = await this.parseJson<GitHubTokenResponse>(
      tokenResponse,
      'GitHub token exchange failed.',
    );

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new UnauthorizedException(
        tokenPayload.error_description ??
          tokenPayload.error ??
          'Không thể xác thực với GitHub.',
      );
    }

    const headers = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${tokenPayload.access_token}`,
      'User-Agent': 'Inkline',
    };
    const profileResponse = await fetch('https://api.github.com/user', {
      headers,
    });
    const profilePayload = await this.parseJson<GitHubUserResponse>(
      profileResponse,
      'GitHub user lookup failed.',
    );

    if (!profileResponse.ok || !profilePayload.id) {
      throw new UnauthorizedException('Không thể đọc hồ sơ GitHub.');
    }

    const email =
      profilePayload.email ?? (await this.getVerifiedEmail(headers)) ?? null;

    if (!email) {
      throw new UnauthorizedException(
        'GitHub account chưa có email đã xác minh để đăng nhập.',
      );
    }

    return {
      provider: 'github',
      providerId: String(profilePayload.id),
      email,
      emailVerified: true,
      displayName:
        profilePayload.name ?? profilePayload.login ?? email.split('@')[0] ?? 'GitHub User',
      avatarUrl: profilePayload.avatar_url ?? null,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token ?? null,
      tokenExpiresAt: tokenPayload.expires_in
        ? new Date(Date.now() + tokenPayload.expires_in * 1000)
        : null,
      rawProfile: profilePayload as Record<string, unknown>,
    };
  }

  private async getVerifiedEmail(headers: Record<string, string>) {
    const response = await fetch('https://api.github.com/user/emails', {
      headers,
    });

    const payload = await this.parseJson<GitHubEmailResponse[]>(
      response,
      'GitHub email lookup failed.',
    );

    if (!response.ok) {
      return null;
    }

    const primaryVerifiedEmail = payload.find(
      (item) => item.verified && item.primary && item.email,
    );

    if (primaryVerifiedEmail?.email) {
      return primaryVerifiedEmail.email;
    }

    return payload.find((item) => item.verified && item.email)?.email ?? null;
  }

  private getConfig() {
    const clientId = this.configService.get<string>('socialAuth.github.clientId');
    const clientSecret = this.configService.get<string>(
      'socialAuth.github.clientSecret',
    );
    const callbackUrl = this.configService.get<string>(
      'socialAuth.github.callbackUrl',
    );

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'GitHub social login chưa được cấu hình đầy đủ.',
      );
    }

    return {
      clientId,
      clientSecret,
      callbackUrl,
    };
  }

  private resolveCallbackUrl(
    callbackUrl: string | undefined,
    configuredCallbackUrl: string | undefined,
  ) {
    const finalCallbackUrl =
      callbackUrl?.trim() || configuredCallbackUrl?.trim();

    if (!finalCallbackUrl) {
      throw new InternalServerErrorException(
        'GitHub social login chưa được cấu hình đầy đủ.',
      );
    }

    return finalCallbackUrl;
  }

  private async parseJson<T>(response: Response, fallbackMessage: string) {
    try {
      return (await response.json()) as T;
    } catch {
      throw new BadGatewayException(fallbackMessage);
    }
  }
}
