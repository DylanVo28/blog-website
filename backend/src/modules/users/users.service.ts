import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toNumber } from '../../common/utils/number.util';
import { PostEntity } from '../posts/entities/post.entity';
import { QuestionEntity } from '../questions/entities/question.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
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

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.findUserOrFail(userId);
    return this.toUserResponse(user);
  }

  async updateCurrentUser(
    userId: string,
    dto: UpdateProfileDto,
  ) {
    const user = await this.findUserOrFail(userId);

    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName;
    }

    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }

    if (dto.bio !== undefined) {
      user.bio = dto.bio;
    }

    const updatedUser = await this.usersRepository.save(user);
    return this.toUserResponse(updatedUser);
  }

  async findPublicProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.findUserOrFail(userId);
    return this.toUserResponse(user);
  }

  async listUserPosts(userId: string) {
    await this.findUserOrFail(userId);
    const posts = await this.postsRepository.find({
      where: {
        authorId: userId,
        status: 'published',
      },
      order: {
        publishedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    return {
      userId,
      items: posts,
    };
  }

  async getUserStats(userId: string) {
    await this.findUserOrFail(userId);
    const [postsCount, questionsCount, wallet] = await Promise.all([
      this.postsRepository.count({
        where: {
          authorId: userId,
        },
      }),
      this.questionsRepository.count({
        where: {
          askerId: userId,
        },
      }),
      this.walletsRepository.findOne({
        where: {
          userId,
        },
      }),
    ]);

    return {
      userId,
      postsCount,
      questionsCount,
      earnings: toNumber(wallet?.totalEarned),
    };
  }

  private async findUserOrFail(userId: string): Promise<UserEntity> {
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
}
