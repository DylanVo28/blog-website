import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppRole } from '../../common/constants';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

interface AuthPayload {
  sub: string;
  email: string;
  role: AppRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const payload = this.buildPayload({
      email: dto.email,
      role: 'reader',
    });

    return this.buildAuthResponse(payload, {
      displayName: dto.displayName,
    });
  }

  async login(dto: LoginDto) {
    const payload = this.buildPayload({
      email: dto.email,
      role: 'reader',
    });

    return this.buildAuthResponse(payload);
  }

  async refresh(dto: RefreshTokenDto) {
    return {
      message: 'Refresh token endpoint scaffolded.',
      refreshToken: dto.refreshToken,
      accessToken: await this.jwtService.signAsync(
        this.buildPayload({
          email: 'refreshed@example.com',
          role: 'reader',
        }),
        {
          secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
        },
      ),
    };
  }

  logout() {
    return {
      success: true,
      message: 'Logout scaffolded. Token invalidation will be added in Phase 3.',
    };
  }

  forgotPassword(email: string) {
    return {
      message: 'Forgot password flow scaffolded.',
      email,
      nextStep: 'Generate reset token and deliver email in Phase 3.',
    };
  }

  resetPassword(token: string, password: string) {
    return {
      message: 'Reset password flow scaffolded.',
      tokenPreview: token.slice(0, 8),
      passwordLength: password.length,
    };
  }

  private buildPayload(input: {
    email: string;
    role: AppRole;
  }): AuthPayload {
    return {
      sub: randomUUID(),
      email: input.email,
      role: input.role,
    };
  }

  private async buildAuthResponse(
    payload: AuthPayload,
    extra?: Record<string, unknown>,
  ) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
    });

    return {
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        ...extra,
      },
      accessToken,
      refreshToken,
    };
  }
}
