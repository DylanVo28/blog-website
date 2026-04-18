import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationsGateway } from './notifications.gateway';
import { PostEntity } from '../posts/entities/post.entity';
import { UserEntity } from '../users/entities/user.entity';

interface DispatchNotificationInput {
  type: string;
  recipientId: string;
  payload?: Record<string, unknown>;
}

interface NotificationContent {
  actorId: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async dispatch(
    input: DispatchNotificationInput,
  ): Promise<NotificationResponseDto> {
    const notification = await this.createNotification(input);

    this.notificationsGateway.emitToUser(
      input.recipientId,
      'notification:new',
      notification,
    );
    this.emitDomainEvent(input);

    return notification;
  }

  async listMine(userId: string) {
    const items = await this.notificationsRepository.find({
      where: {
        recipientId: userId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 50,
    });

    return {
      items: items.map((item) => this.toResponse(item)),
    };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.notificationsRepository.findOne({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return this.toResponse(notification);
  }

  async markAllRead(userId: string) {
    const readAt = new Date();

    await this.notificationsRepository
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({
        isRead: true,
        readAt,
      })
      .where('recipient_id = :userId', {
        userId,
      })
      .andWhere('is_read = false')
      .execute();

    return {
      updated: true,
      readAt,
    };
  }

  private async createNotification(
    input: DispatchNotificationInput,
  ): Promise<NotificationResponseDto> {
    const content = await this.buildNotificationContent(input);
    const savedNotification = await this.notificationsRepository.save(
      this.notificationsRepository.create({
        recipientId: input.recipientId,
        actorId: content.actorId,
        type: content.type,
        title: content.title,
        message: content.message,
        data: content.data,
        isRead: false,
        readAt: null,
      }),
    );

    return this.toResponse(savedNotification);
  }

  private async buildNotificationContent(
    input: DispatchNotificationInput,
  ): Promise<NotificationContent> {
    switch (input.type) {
      case 'comment_created':
        return this.buildCommentCreatedContent(input.payload);
      case 'question_created':
        return this.buildQuestionCreatedContent(input.payload);
      case 'question_answered':
        return this.buildQuestionAnsweredContent(input.payload);
      case 'question_refunded':
        return this.buildQuestionRefundedContent(input.payload);
      case 'content_agent_run_succeeded':
        return this.buildContentAgentSucceededContent(input.payload);
      case 'content_agent_run_failed':
        return this.buildContentAgentFailedContent(input.payload);
      default:
        return {
          actorId: null,
          type: 'system',
          title: 'Thông báo hệ thống',
          message: 'Bạn có một cập nhật mới trên tài khoản của mình.',
          data: input.payload ?? {},
        };
    }
  }

  private async buildCommentCreatedContent(
    payload?: Record<string, unknown>,
  ): Promise<NotificationContent> {
    const postId = this.readString(payload?.postId);
    const commentId = this.readString(payload?.commentId);
    const actorId = this.readString(payload?.userId);
    const [post, actor] = await Promise.all([
      this.findPost(postId),
      this.findUser(actorId),
    ]);
    const postTitle = post?.title ?? 'bài viết của bạn';
    const actorName = actor?.displayName ?? 'Một độc giả';

    return {
      actorId,
      type: 'new_comment',
      title: 'Bài viết của bạn có bình luận mới',
      message: `${actorName} vừa bình luận trên "${postTitle}".`,
      data: {
        postId,
        postSlug: post?.slug ?? null,
        commentId,
        actorId,
      },
    };
  }

  private async buildContentAgentSucceededContent(
    payload?: Record<string, unknown>,
  ): Promise<NotificationContent> {
    const postId = this.readString(payload?.postId);
    const runId = this.readString(payload?.runId);
    const post = await this.findPost(postId);
    const configName =
      this.readString(payload?.configName) ?? 'AI content agent';

    return {
      actorId: null,
      type: 'content_agent_run_succeeded',
      title: 'AI agent đã tạo bản nháp mới',
      message: post
        ? `${configName} vừa tạo bản nháp "${post.title}".`
        : `${configName} vừa hoàn tất một lượt research và tạo bản nháp mới.`,
      data: {
        runId,
        postId,
        postSlug: post?.slug ?? null,
        configId: this.readString(payload?.configId),
      },
    };
  }

  private async buildContentAgentFailedContent(
    payload?: Record<string, unknown>,
  ): Promise<NotificationContent> {
    const configName =
      this.readString(payload?.configName) ?? 'AI content agent';
    const reason =
      this.readString(payload?.reason) ?? 'Không xác định được nguyên nhân.';

    return {
      actorId: null,
      type: 'content_agent_run_failed',
      title: 'AI agent chạy lỗi',
      message: `${configName} không thể tạo bản nháp mới. Lý do: ${reason}`,
      data: {
        runId: this.readString(payload?.runId),
        configId: this.readString(payload?.configId),
      },
    };
  }

  private async buildQuestionCreatedContent(
    payload?: Record<string, unknown>,
  ): Promise<NotificationContent> {
    const postId = this.readString(payload?.postId);
    const questionId = this.readString(payload?.questionId);
    const post = await this.findPost(postId);

    return {
      actorId: null,
      type: 'new_question',
      title: 'Bạn có một câu hỏi trả phí mới',
      message: post
        ? `Một độc giả vừa gửi câu hỏi mới cho bài "${post.title}".`
        : 'Một độc giả vừa gửi câu hỏi mới cho bạn.',
      data: {
        postId,
        postSlug: post?.slug ?? null,
        questionId,
      },
    };
  }

  private async buildQuestionAnsweredContent(
    payload?: Record<string, unknown>,
  ): Promise<NotificationContent> {
    const postId = this.readString(payload?.postId);
    const questionId = this.readString(payload?.questionId);
    const target = this.readString(payload?.target);
    const post = await this.findPost(postId);
    const answeredByAi = target === 'ai';

    return {
      actorId: this.readString(payload?.answeredBy),
      type: 'question_answered',
      title: answeredByAi
        ? 'AI đã trả lời câu hỏi của bạn'
        : 'Tác giả đã trả lời câu hỏi của bạn',
      message: post
        ? `Câu hỏi của bạn trong bài "${post.title}" đã có phản hồi mới.`
        : 'Câu hỏi của bạn đã có phản hồi mới.',
      data: {
        postId,
        postSlug: post?.slug ?? null,
        questionId,
        target,
      },
    };
  }

  private async buildQuestionRefundedContent(
    payload?: Record<string, unknown>,
  ): Promise<NotificationContent> {
    const postId = this.readString(payload?.postId);
    const questionId = this.readString(payload?.questionId);
    const post = await this.findPost(postId);

    return {
      actorId: null,
      type: 'question_refunded',
      title: 'Câu hỏi của bạn đã được hoàn tiền',
      message: post
        ? `Khoản phí cho câu hỏi trong bài "${post.title}" đã được hoàn lại vào ví của bạn.`
        : 'Khoản phí câu hỏi đã được hoàn lại vào ví của bạn.',
      data: {
        postId,
        postSlug: post?.slug ?? null,
        questionId,
        reason: payload?.reason ?? null,
      },
    };
  }

  private emitDomainEvent(input: DispatchNotificationInput): void {
    const postId = this.readString(input.payload?.postId);
    const questionId = this.readString(input.payload?.questionId);

    if (input.type === 'comment_created' && postId) {
      this.notificationsGateway.emitToUser(input.recipientId, 'comment:new', {
        postId,
      });
      return;
    }

    if (input.type === 'question_answered' && postId) {
      const event =
        this.readString(input.payload?.target) === 'ai'
          ? 'question:ai_answered'
          : 'question:answered';

      this.notificationsGateway.emitToUser(input.recipientId, event, {
        postId,
        questionId,
      });
      return;
    }

    if (input.type === 'question_refunded' && postId) {
      this.notificationsGateway.emitToUser(
        input.recipientId,
        'question:refunded',
        {
          postId,
          questionId,
        },
      );
    }
  }

  private toResponse(
    notification: NotificationEntity,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      data: notification.data ?? {},
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    };
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private async findPost(postId: string | null): Promise<PostEntity | null> {
    if (!postId) {
      return null;
    }

    try {
      return await this.postsRepository.findOne({
        where: {
          id: postId,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Unable to resolve post ${postId} for notification content.`,
        error instanceof Error ? error.message : undefined,
      );
      return null;
    }
  }

  private async findUser(userId: string | null): Promise<UserEntity | null> {
    if (!userId) {
      return null;
    }

    try {
      return await this.usersRepository.findOne({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Unable to resolve actor ${userId} for notification content.`,
        error instanceof Error ? error.message : undefined,
      );
      return null;
    }
  }
}
