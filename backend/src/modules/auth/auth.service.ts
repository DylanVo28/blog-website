import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppRole } from '../../common/constants';
import { hashPassword, verifyPassword } from '../../common/utils/password.util';
import { generateToken, hashToken } from '../../common/utils/token.util';
import { UserEntity } from '../users/entities/user.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
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
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    const user = await this.dataSource.transaction(async (manager) => {
      const createdUser = manager.create(UserEntity, {
        email: dto.email.toLowerCase(),
        passwordHash: await hashPassword(dto.password),
        displayName: dto.displayName,
        role: 'reader',
      });

      const savedUser = await manager.save(UserEntity, createdUser);
      await manager.save(
        WalletEntity,
        manager.create(WalletEntity, {
          userId: savedUser.id,
          balance: '0',
          totalEarned: '0',
          totalSpent: '0',
        }),
      );

      return savedUser;
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    this.ensureUserIsActive(user);

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: AuthPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthPayload>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.usersRepository.findOne({
      where: {
        id: payload.sub,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found for refresh token.');
    }

    this.ensureUserIsActive(user);

    return {
      accessToken: await this.signAccessToken(user),
      refreshToken: await this.signRefreshToken(user),
    };
  }

  logout() {
    return {
      success: true,
      message: 'Logged out successfully. Discard the current access and refresh tokens on the client.',
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    const genericResponse = {
      success: true,
      message:
        'If the account exists, a password reset token has been generated.',
    };

    if (!user || user.bannedAt) {
      return genericResponse;
    }

    const resetToken = generateToken();
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersRepository.save(user);

    return {
      ...genericResponse,
      ...(process.env.NODE_ENV === 'production'
        ? {}
        : {
            resetToken,
            expiresAt: user.resetPasswordExpiresAt,
          }),
    };
  }

  async resetPassword(token: string, password: string) {
    const resetPasswordToken = hashToken(token);
    const user = await this.usersRepository.findOne({
      where: {
        resetPasswordToken,
      },
    });

    if (
      !user ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Reset token is invalid or expired.');
    }

    this.ensureUserIsActive(user);

    user.passwordHash = await hashPassword(password);
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await this.usersRepository.save(user);

    return {
      success: true,
      message: 'Password has been reset successfully.',
    };
  }

  private buildPayload(user: UserEntity): AuthPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private async buildAuthResponse(user: UserEntity) {
    const payload = this.buildPayload(user);
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
        isBanned: Boolean(user.bannedAt),
        bannedAt: user.bannedAt,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  private signAccessToken(user: UserEntity) {
    return this.jwtService.signAsync(this.buildPayload(user), {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  private signRefreshToken(user: UserEntity) {
    return this.jwtService.signAsync(this.buildPayload(user), {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
    });
  }

  private ensureUserIsActive(user: UserEntity) {
    if (user.bannedAt) {
      throw new UnauthorizedException('This account has been banned.');
    }
  }
}
