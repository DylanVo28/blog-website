import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  create(authorId: string, dto: CreatePostDto) {
    return {
      id: randomUUID(),
      authorId,
      slug: dto.slug ?? this.generateSlug(dto.title),
      status: 'draft',
      ...dto,
    };
  }

  findAll(query: PostQueryDto) {
    return {
      page: query.page,
      limit: query.limit,
      filters: query,
      items: [],
    };
  }

  findOneBySlug(slug: string) {
    return {
      slug,
      message: 'Post detail scaffolded for Phase 3.',
    };
  }

  update(id: string, authorId: string, dto: UpdatePostDto) {
    return {
      id,
      authorId,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
  }

  remove(id: string, actorId: string) {
    return {
      id,
      actorId,
      deleted: false,
      message: 'Soft delete logic will be added in Phase 3.',
    };
  }

  publish(id: string, authorId: string) {
    return {
      id,
      authorId,
      status: 'published',
      publishedAt: new Date().toISOString(),
    };
  }

  getFeed(userId?: string) {
    return {
      userId: userId ?? null,
      items: [],
      message: 'Personalized feed scaffolded for Phase 3.',
    };
  }

  private generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
