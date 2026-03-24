import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WalletEntity } from '../../wallet/entities/wallet.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { AuthService } from '../auth.service';
import { SocialAccountEntity } from '../entities/social-account.entity';
import { GitHubAuthService } from './github-auth.service';
import { GoogleAuthService } from './google-auth.service';
import type {
  SocialProfile,
  SocialProvider,
} from '../types/social-auth.types';

interface SocialStatePayload {
  provider: SocialProvider;
  redirect: string;
  nonce: string;
  purpose: 'social_oauth_state';
}

interface AuthorizationRequest {
  authorizationUrl: string;
  cookieName: string;
  stateToken: string;
  maxAge: number;
}

@Injectable()
export class SocialAuthService {
  private static readonly STATE_TTL_SECONDS = 10 * 60;
  private static readonly STATE_TTL_MS =
    SocialAuthService.STATE_TTL_SECONDS * 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly githubAuthService: GitHubAuthService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountsRepository: Repository<SocialAccountEntity>,
  ) {}

  async createAuthorizationRequest(
    provider: SocialProvider,
    redirectPath?: string,
  ): Promise<AuthorizationRequest> {
    const redirect = this.normalizeRedirectPath(redirectPath);
    const stateToken = await this.jwtService.signAsync(
      {
        provider,
        redirect,
        nonce: randomUUID(),
        purpose: 'social_oauth_state',
      } satisfies SocialStatePayload,
      {
        secret: this.configService.getOrThrow<string>('jwt.verificationSecret'),
        expiresIn: SocialAuthService.STATE_TTL_SECONDS,
      },
    );

    return {
      authorizationUrl: this.getProviderService(provider).buildAuthorizationUrl(
        stateToken,
      ),
      cookieName: this.getStateCookieName(provider),
      stateToken,
      maxAge: SocialAuthService.STATE_TTL_MS,
    };
  }

  async validateCallbackState(
    provider: SocialProvider,
    stateToken: string | undefined,
    cookieToken: string | null,
  ) {
    if (!stateToken || !cookieToken || stateToken !== cookieToken) {
      throw new UnauthorizedException(
        'Phiên đăng nhập mạng xã hội không hợp lệ hoặc đã hết hạn.',
      );
    }

    let payload: SocialStatePayload;
    try {
      payload = await this.jwtService.verifyAsync<SocialStatePayload>(
        stateToken,
        {
          secret: this.configService.getOrThrow<string>(
            'jwt.verificationSecret',
          ),
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập mạng xã hội đã hết hạn. Vui lòng thử lại.',
      );
    }

    if (
      payload.purpose !== 'social_oauth_state' ||
      payload.provider !== provider
    ) {
      throw new UnauthorizedException('Provider social login không hợp lệ.');
    }

    return payload.redirect;
  }

  async authenticateWithCode(provider: SocialProvider, code: string) {
    const profile = await this.getProviderService(provider).getProfileFromCode(
      code,
    );
    const user = await this.findOrCreateUserForProfile(profile);
    return this.authService.createSessionForUser(user);
  }

  getStateCookieName(provider: SocialProvider) {
    return `social_oauth_state_${provider}`;
  }

  private async findOrCreateUserForProfile(profile: SocialProfile) {
    const normalizedEmail = profile.email.trim().toLowerCase();

    const existingSocialAccount = await this.socialAccountsRepository.findOne({
      where: {
        provider: profile.provider,
        providerId: profile.providerId,
      },
      relations: {
        user: true,
      },
    });

    if (existingSocialAccount) {
      this.ensureUserIsNotBanned(existingSocialAccount.user);
      await this.socialAccountsRepository.save(
        this.socialAccountsRepository.create({
          id: existingSocialAccount.id,
          userId: existingSocialAccount.userId,
          provider: existingSocialAccount.provider,
          providerId: existingSocialAccount.providerId,
          email: normalizedEmail,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          tokenExpiresAt: profile.tokenExpiresAt,
          rawProfile: profile.rawProfile,
        }),
      );

      return existingSocialAccount.user;
    }

    const existingUser = await this.usersRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      this.ensureUserIsNotBanned(existingUser);
      await this.upsertSocialAccount(existingUser.id, {
        ...profile,
        email: normalizedEmail,
      });
      return existingUser;
    }

    return this.createUserWithSocialAccount({
      ...profile,
      email: normalizedEmail,
    });
  }

  private async createUserWithSocialAccount(profile: SocialProfile) {
    return this.dataSource.transaction(async (manager) => {
      const createdAt = new Date();
      const user = manager.create(UserEntity, {
        email: profile.email,
        username: null,
        passwordHash: null,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: null,
        role: 'reader',
        isVerified: true,
        emailVerifiedAt: createdAt,
        authProvider: profile.provider,
        isPasswordSet: false,
      });

      const savedUser = await manager.save(UserEntity, user);
      await manager.save(
        WalletEntity,
        manager.create(WalletEntity, {
          userId: savedUser.id,
          balance: '0',
          totalEarned: '0',
          totalSpent: '0',
        }),
      );
      await manager.save(
        SocialAccountEntity,
        manager.create(SocialAccountEntity, {
          userId: savedUser.id,
          provider: profile.provider,
          providerId: profile.providerId,
          email: profile.email,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          tokenExpiresAt: profile.tokenExpiresAt,
          rawProfile: profile.rawProfile,
        }),
      );

      return savedUser;
    });
  }

  private async upsertSocialAccount(userId: string, profile: SocialProfile) {
    const existingProviderLink = await this.socialAccountsRepository.findOne({
      where: {
        userId,
        provider: profile.provider,
      },
    });

    if (
      existingProviderLink &&
      existingProviderLink.providerId !== profile.providerId
    ) {
      throw new ConflictException(
        `Tài khoản ${profile.provider} khác đã được liên kết với email này.`,
      );
    }

    await this.socialAccountsRepository.save(
      this.socialAccountsRepository.create({
        id: existingProviderLink?.id,
        userId,
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        tokenExpiresAt: profile.tokenExpiresAt,
        rawProfile: profile.rawProfile,
      }),
    );
  }

  private ensureUserIsNotBanned(user: UserEntity) {
    if (user.bannedAt) {
      throw new UnauthorizedException('This account has been banned.');
    }
  }

  private normalizeRedirectPath(rawRedirect?: string) {
    if (!rawRedirect) {
      return '/';
    }

    const redirect = rawRedirect.trim();
    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
      return '/';
    }

    return redirect;
  }

  private getProviderService(provider: SocialProvider) {
    if (provider === 'google') {
      return this.googleAuthService;
    }

    return this.githubAuthService;
  }
}
