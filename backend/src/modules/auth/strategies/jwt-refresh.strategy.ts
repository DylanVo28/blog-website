import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { CurrentUserData } from '../../../common/decorators/current-user.decorator';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.refreshSecret'),
    });
  }

  async validate(
    payload: CurrentUserData & { iat?: number },
  ): Promise<CurrentUserData> {
    const user = await this.usersRepository.findOne({
      where: {
        id: payload.sub,
      },
    });

    if (!user || user.bannedAt) {
      throw new UnauthorizedException('This refresh token is no longer valid.');
    }

    if (
      payload.iat &&
      user.passwordChangedAt &&
      Math.floor(user.passwordChangedAt.getTime() / 1000) > payload.iat
    ) {
      throw new UnauthorizedException('This refresh token is no longer valid.');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
