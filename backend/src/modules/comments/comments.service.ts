import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  create(postId: string, userId: string, dto: CreateCommentDto) {
    return {
      id: randomUUID(),
      postId,
      userId,
      ...dto,
      isHidden: false,
    };
  }

  listByPost(postId: string) {
    return {
      postId,
      items: [],
    };
  }

  update(commentId: string, userId: string, dto: CreateCommentDto) {
    return {
      id: commentId,
      userId,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
  }

  remove(commentId: string, userId: string) {
    return {
      id: commentId,
      userId,
      removed: false,
      message: 'Delete logic scaffolded for Phase 3.',
    };
  }
}
