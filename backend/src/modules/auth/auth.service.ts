import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, MoreThan, Repository } from 'typeorm';
import { AppRole } from '../../common/constants';
import { hashPassword, verifyPassword } from '../../common/utils/password.util';
import { generateToken, hashToken } from '../../common/utils/token.util';
import { MailService } from '../mail/mail.service';
import { UserEntity } from '../users/entities/user.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';

interface AuthPayload {
  sub: string;
  email: string;
  role: AppRole;
  iat?: number;
}

@Injectable()
export class AuthService {
  private static readonly PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;
  private static readonly PASSWORD_RESET_COOLDOWN_SECONDS = 60;
  private static readonly PASSWORD_RESET_MAX_REQUESTS_PER_HOUR = 3;

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokensRepository: Repository<PasswordResetTokenEntity>,
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
    this.ensureTokenIssuedAfterPasswordChange(payload.iat, user.passwordChangedAt);

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

  async forgotPassword(dto: ForgotPasswordDto) {
    await this.cleanupExpiredResetTokens();

    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    const genericResponse = {
      success: true,
      message:
        'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
    };

    if (!user || user.bannedAt) {
      return genericResponse;
    }

    const resetToken = generateToken();
    const lastRequest = await this.passwordResetTokensRepository.findOne({
      where: {
        userId: user.id,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (lastRequest) {
      const elapsedSeconds =
        (Date.now() - lastRequest.createdAt.getTime()) / 1000;

      if (elapsedSeconds < AuthService.PASSWORD_RESET_COOLDOWN_SECONDS) {
        throw new BadRequestException(
          `Vui lòng đợi ${Math.ceil(
            AuthService.PASSWORD_RESET_COOLDOWN_SECONDS - elapsedSeconds,
          )} giây trước khi gửi lại yêu cầu.`,
        );
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const requestCount = await this.passwordResetTokensRepository.count({
      where: {
        userId: user.id,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (requestCount >= AuthService.PASSWORD_RESET_MAX_REQUESTS_PER_HOUR) {
      throw new BadRequestException(
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ.',
      );
    }

    const expiresAt = new Date(
      Date.now() + AuthService.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    );
    const otpCode = this.generateOtp();

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        PasswordResetTokenEntity,
        {
          userId: user.id,
          usedAt: null,
        },
        {
          usedAt: new Date(),
        },
      );

      await manager.save(
        PasswordResetTokenEntity,
        manager.create(PasswordResetTokenEntity, {
          userId: user.id,
          token: hashToken(resetToken),
          otpCode,
          expiresAt,
          usedAt: null,
          blockedUntil: null,
          attempts: 0,
          maxAttempts: 5,
        }),
      );

      await manager.update(
        UserEntity,
        {
          id: user.id,
        },
        {
          resetPasswordToken: hashToken(resetToken),
          resetPasswordExpiresAt: expiresAt,
        },
      );
    });

    const resetUrl = this.buildResetPasswordUrl(resetToken);
    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      userName: user.displayName || user.email,
      resetUrl,
      otpCode,
      expiresInMinutes: AuthService.PASSWORD_RESET_TOKEN_TTL_MINUTES,
    });

    return {
      ...genericResponse,
      ...(process.env.NODE_ENV === 'production'
        ? {}
        : {
            resetToken,
            resetUrl,
            otpCode,
            expiresAt,
          }),
    };
  }

  async verifyResetToken(dto: VerifyResetTokenDto) {
    const resetToken = await this.findValidResetToken(dto.token);

    if (dto.otpCode && resetToken.otpCode !== dto.otpCode) {
      await this.handleInvalidOtpAttempt(resetToken);
    }

    return {
      success: true,
      valid: true,
      email: this.maskEmail(resetToken.user.email),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp.');
    }

    const resetToken = await this.findValidResetToken(dto.token);
    const user = resetToken.user;

    this.ensureUserIsActive(user);

    const isSamePassword = await verifyPassword(
      dto.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu cũ.',
      );
    }

    const passwordHash = await hashPassword(dto.newPassword);
    const passwordChangedAt = this.createPasswordChangedAt();

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        UserEntity,
        {
          id: user.id,
        },
        {
          passwordHash,
          passwordChangedAt,
          resetPasswordToken: null,
          resetPasswordExpiresAt: null,
        },
      );

      await manager.update(
        PasswordResetTokenEntity,
        {
          userId: user.id,
          usedAt: null,
        },
        {
          usedAt: passwordChangedAt,
        },
      );
    });

    await this.mailService.sendPasswordChangedNotification({
      to: user.email,
      userName: user.displayName || user.email,
      changedAt: passwordChangedAt,
      ipAddress: null,
    });

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
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

  private ensureTokenIssuedAfterPasswordChange(
    issuedAt: number | undefined,
    passwordChangedAt: Date | null,
  ) {
    if (!issuedAt || !passwordChangedAt) {
      return;
    }

    const passwordChangedAtSeconds = Math.floor(
      passwordChangedAt.getTime() / 1000,
    );

    if (passwordChangedAtSeconds > issuedAt) {
      throw new UnauthorizedException('This token is no longer valid.');
    }
  }

  private async findValidResetToken(rawToken: string) {
    const resetToken = await this.passwordResetTokensRepository.findOne({
      where: {
        token: hashToken(rawToken),
      },
      relations: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn.');
    }

    if (resetToken.isUsed) {
      throw new BadRequestException(
        'Token đã được sử dụng. Vui lòng yêu cầu link mới.',
      );
    }

    if (resetToken.isExpired) {
      throw new BadRequestException(
        `Token đã hết hạn. Vui lòng yêu cầu link mới (có hiệu lực ${AuthService.PASSWORD_RESET_TOKEN_TTL_MINUTES} phút).`,
      );
    }

    if (resetToken.isBlocked) {
      throw new ForbiddenException(
        'Token đã bị khóa do nhập sai quá nhiều lần. Vui lòng yêu cầu link mới.',
      );
    }

    return resetToken;
  }

  private async handleInvalidOtpAttempt(resetToken: PasswordResetTokenEntity) {
    const nextAttempts = resetToken.attempts + 1;
    const shouldBlock = nextAttempts >= resetToken.maxAttempts;

    await this.passwordResetTokensRepository.update(
      {
        id: resetToken.id,
      },
      {
        attempts: nextAttempts,
        blockedUntil: shouldBlock ? resetToken.expiresAt : null,
      },
    );

    if (shouldBlock) {
      throw new ForbiddenException(
        'Mã OTP đã bị khóa do nhập sai quá nhiều lần. Vui lòng yêu cầu link mới.',
      );
    }

    throw new BadRequestException('Mã OTP không chính xác.');
  }

  private generateOtp() {
    return randomInt(100000, 1000000).toString();
  }

  private buildResetPasswordUrl(rawToken: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';

    return `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
  }

  private createPasswordChangedAt() {
    return new Date(Math.floor(Date.now() / 1000) * 1000);
  }

  private maskEmail(email: string) {
    const [localPart, domain] = email.split('@');

    if (!localPart || !domain) {
      return email;
    }

    if (localPart.length <= 2) {
      return `${localPart[0] ?? '*'}***@${domain}`;
    }

    return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${
      localPart[localPart.length - 1]
    }@${domain}`;
  }

  private async cleanupExpiredResetTokens() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.passwordResetTokensRepository.delete({
      createdAt: LessThan(cutoff),
    });
  }
}
