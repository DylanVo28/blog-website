import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  getCurrentUser(userId: string, email = 'current-user@example.com'): UserResponseDto {
    return this.toUserResponse(userId, email);
  }

  updateCurrentUser(
    userId: string,
    dto: UpdateProfileDto,
    email = 'current-user@example.com',
  ) {
    return {
      ...this.toUserResponse(userId, email),
      ...dto,
      updatedAt: new Date().toISOString(),
    };
  }

  findPublicProfile(userId: string): UserResponseDto {
    return this.toUserResponse(userId, `user-${userId.slice(0, 6)}@example.com`);
  }

  listUserPosts(userId: string) {
    return {
      userId,
      items: [],
      message: 'Posts listing scaffolded for Phase 3.',
    };
  }

  getUserStats(userId: string) {
    return {
      userId,
      postsCount: 0,
      questionsCount: 0,
      earnings: 0,
    };
  }

  private toUserResponse(userId: string, email: string): UserResponseDto {
    return {
      id: userId,
      email,
      displayName: 'Phase 2 User',
      avatarUrl: null,
      bio: 'NestJS scaffold for the blog platform.',
      role: 'reader',
      isVerified: false,
      createdAt: new Date(),
    };
  }
}
