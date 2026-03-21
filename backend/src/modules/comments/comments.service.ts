import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentEntity } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  private readonly questionPatterns = [
    /\?/,
    /\b(lam sao|nhu the nao|tai sao|cho hoi|giup minh|giai thich)\b/i,
    /\b(how|why|what|can you|could you|please explain)\b/i,
  ];

  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentsRepository: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
  ) {}

  async create(postId: string, userId: string, dto: CreateCommentDto) {
    await this.ensurePostExists(postId);
    await this.validateParent(dto.parentId, postId);

    const comment = await this.commentsRepository.save(
      this.commentsRepository.create({
        postId,
        userId,
        parentId: dto.parentId ?? null,
        content: dto.content,
        isHidden: false,
      }),
    );

    const suggestion = this.detectQuestion(dto.content)
      ? {
          show: true,
          message:
            'Co ve ban dang muon hoi tac gia? Dung tinh nang Question (1.000d) de duoc uu tien tra loi!',
        }
      : null;

    return {
      comment,
      suggestion,
    };
  }

  async listByPost(postId: string) {
    await this.ensurePostExists(postId);
    const items = await this.commentsRepository.find({
      where: {
        postId,
        isHidden: false,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return {
      postId,
      items,
    };
  }

  async update(commentId: string, userId: string, dto: CreateCommentDto) {
    const comment = await this.findCommentOrFail(commentId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comment.');
    }

    if (dto.parentId !== undefined) {
      await this.validateParent(dto.parentId, comment.postId);
      comment.parentId = dto.parentId ?? null;
    }

    comment.content = dto.content;
    return this.commentsRepository.save(comment);
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.findCommentOrFail(commentId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comment.');
    }

    comment.isHidden = true;
    comment.content = '[deleted]';
    await this.commentsRepository.save(comment);

    return {
      id: commentId,
      removed: true,
    };
  }

  private detectQuestion(text: string): boolean {
    const matchCount = this.questionPatterns.filter((pattern) =>
      pattern.test(text),
    ).length;

    return matchCount >= 2;
  }

  private async ensurePostExists(postId: string) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }
  }

  private async validateParent(parentId: string | undefined, postId: string) {
    if (!parentId) {
      return;
    }

    const parent = await this.commentsRepository.findOne({
      where: {
        id: parentId,
      },
    });

    if (!parent || parent.postId !== postId) {
      throw new NotFoundException('Parent comment not found.');
    }
  }

  private async findCommentOrFail(commentId: string): Promise<CommentEntity> {
    const comment = await this.commentsRepository.findOne({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    return comment;
  }
}
