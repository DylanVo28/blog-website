import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toNumber } from '../../common/utils/number.util';
import { PostEntity } from '../posts/entities/post.entity';
import { QuestionEntity } from '../questions/entities/question.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questionsRepository: Repository<QuestionEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
  ) {}

  async getCurrentUser(userId: string): Promise<CurrentUserResponseDto> {
    const user = await this.findUserOrFailById(userId);
    return this.toCurrentUserResponse(user);
  }

  async updateCurrentUser(userId: string, dto: UpdateProfileDto) {
    const user = await this.findUserOrFailById(userId);

    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName;
    }

    if (dto.username !== undefined) {
      const existingUser = await this.usersRepository.findOne({
        where: {
          username: dto.username,
        },
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new BadRequestException('Username đã tồn tại.');
      }

      user.username = dto.username;
    }

    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }

    if (dto.bio !== undefined) {
      user.bio = dto.bio;
    }

    if (dto.bankName !== undefined) {
      user.bankName = dto.bankName;
    }

    if (dto.bankAccount !== undefined) {
      user.bankAccount = dto.bankAccount;
    }

    if (dto.bankHolder !== undefined) {
      user.bankHolder = dto.bankHolder;
    }

    const updatedUser = await this.usersRepository.save(user);
    return this.toCurrentUserResponse(updatedUser);
  }

  async findPublicProfile(identifier: string): Promise<UserResponseDto> {
    const user = await this.findUserOrFailByIdentifier(identifier);
    return this.toUserResponse(user);
  }

  async listUserPosts(identifier: string) {
    const user = await this.findUserOrFailByIdentifier(identifier);
    const posts = await this.postsRepository.find({
      where: {
        authorId: user.id,
        status: 'published',
      },
      order: {
        publishedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    return {
      userId: user.id,
      items: posts,
    };
  }

  async getUserStats(identifier: string) {
    const user = await this.findUserOrFailByIdentifier(identifier);
    const [postsCount, questionsCount, wallet] = await Promise.all([
      this.postsRepository.count({
        where: {
          authorId: user.id,
        },
      }),
      this.questionsRepository.count({
        where: {
          askerId: user.id,
        },
      }),
      this.walletsRepository.findOne({
        where: {
          userId: user.id,
        },
      }),
    ]);

    return {
      userId: user.id,
      postsCount,
      questionsCount,
      earnings: toNumber(wallet?.totalEarned),
    };
  }

  private async findUserOrFailById(userId: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  private async findUserOrFailByIdentifier(identifier: string): Promise<UserEntity> {
    const user = isUuid(identifier)
      ? await this.usersRepository.findOne({
          where: {
            id: identifier,
          },
        })
      : await this.usersRepository.findOne({
          where: {
            username: identifier,
          },
        });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  private toUserResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      isVerified: user.isVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      authProvider: user.authProvider,
      isPasswordSet: user.isPasswordSet,
      isBanned: Boolean(user.bannedAt),
      bannedAt: user.bannedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toCurrentUserResponse(user: UserEntity): CurrentUserResponseDto {
    return {
      ...this.toUserResponse(user),
      bankName: user.bankName,
      bankAccount: user.bankAccount,
      bankHolder: user.bankHolder,
    };
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
