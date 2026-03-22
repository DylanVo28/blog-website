import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppRole } from '../../common/constants';
import { JobQueueService } from '../../jobs/job-queue.service';
import { UploadService } from '../upload/upload.service';
import { CategoryEntity } from './entities/category.entity';
import { PostEntity } from './entities/post.entity';
import { PostTagEntity } from './entities/post-tag.entity';
import { TagEntity } from './entities/tag.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import type { UploadedImageFile } from '../upload/upload.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly uploadService: UploadService,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tagsRepository: Repository<TagEntity>,
    @InjectRepository(PostTagEntity)
    private readonly postTagsRepository: Repository<PostTagEntity>,
  ) {}

  async create(
    authorId: string,
    dto: CreatePostDto,
    coverImageFile?: UploadedImageFile,
  ) {
    await this.validateCategory(dto.categoryId);
    await this.validateTags(dto.tagIds);

    const uploadedCover = coverImageFile
      ? await this.uploadService.uploadImage(coverImageFile, 'posts')
      : null;

    const post = this.postsRepository.create({
      authorId,
      title: dto.title,
      slug: await this.generateUniqueSlug(dto.slug ?? dto.title),
      content: dto.content,
      contentPlain: dto.contentPlain ?? null,
      excerpt: dto.excerpt ?? null,
      coverImage: uploadedCover?.url ?? dto.coverImage ?? null,
      categoryId: dto.categoryId ?? null,
      status: 'draft',
      publishedAt: null,
    });

    try {
      const savedPost = await this.postsRepository.save(post);
      await this.syncTags(savedPost.id, dto.tagIds);

      return this.findById(savedPost.id);
    } catch (error) {
      await this.uploadService.removeFileByUrl(uploadedCover?.url);
      throw error;
    }
  }

  async findAll(query: PostQueryDto) {
    const builder = this.postsRepository.createQueryBuilder('post');

    if (query.search) {
      builder.andWhere(
        '(post.title ILIKE :search OR post.content_plain ILIKE :search OR post.excerpt ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.status) {
      builder.andWhere('post.status = :status', {
        status: query.status,
      });
    } else {
      builder.andWhere('post.status = :status', {
        status: 'published',
      });
    }

    if (query.categoryId) {
      builder.andWhere('post.category_id = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.authorId) {
      builder.andWhere('post.author_id = :authorId', {
        authorId: query.authorId,
      });
    }

    if (query.tag) {
      builder
        .innerJoin(
          PostTagEntity,
          'postTagFilter',
          'postTagFilter.post_id = post.id',
        )
        .innerJoin(TagEntity, 'tagFilter', 'tagFilter.id = postTagFilter.tag_id')
        .andWhere('(tagFilter.slug = :tag OR tagFilter.id = :tag)', {
          tag: query.tag,
        });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    builder
      .orderBy('post.published_at', 'DESC', 'NULLS LAST')
      .addOrderBy('post.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await builder.getManyAndCount();

    return {
      page,
      limit,
      total,
      items: await Promise.all(posts.map((post) => this.attachTags(post))),
    };
  }

  async findOneBySlug(slug: string) {
    const post = await this.postsRepository.findOne({
      where: {
        slug,
      },
    });

    if (!post || post.status !== 'published') {
      throw new NotFoundException('Post not found.');
    }

    post.viewCount = String(Number(post.viewCount) + 1);
    await this.postsRepository.save(post);

    return this.attachTags(post);
  }

  async update(
    id: string,
    actorId: string,
    role: AppRole,
    dto: UpdatePostDto,
    coverImageFile?: UploadedImageFile,
  ) {
    const post = await this.findPostOrFail(id);
    this.assertCanManagePost(post, actorId, role);
    const shouldReindexPublishedPost =
      post.status === 'published' &&
      [
        dto.title,
        dto.content,
        dto.contentPlain,
        dto.excerpt,
        dto.coverImage,
        coverImageFile,
      ].some((value) => value !== undefined);

    const uploadedCover = coverImageFile
      ? await this.uploadService.uploadImage(coverImageFile, 'posts')
      : null;
    const previousCoverImage = post.coverImage;

    if (dto.categoryId !== undefined) {
      await this.validateCategory(dto.categoryId);
      post.categoryId = dto.categoryId ?? null;
    }

    if (dto.title !== undefined) {
      post.title = dto.title;
    }

    if (dto.slug !== undefined) {
      post.slug = await this.generateUniqueSlug(dto.slug, post.id);
    }

    if (dto.content !== undefined) {
      post.content = dto.content;
    }

    if (dto.contentPlain !== undefined) {
      post.contentPlain = dto.contentPlain;
    }

    if (dto.excerpt !== undefined) {
      post.excerpt = dto.excerpt;
    }

    if (uploadedCover) {
      post.coverImage = uploadedCover.url;
    } else if (dto.coverImage !== undefined) {
      post.coverImage = dto.coverImage ?? null;
    }

    await this.validateTags(dto.tagIds);

    try {
      await this.postsRepository.save(post);

      if (dto.tagIds !== undefined) {
        await this.syncTags(post.id, dto.tagIds);
      }

      if (shouldReindexPublishedPost) {
        this.queuePostEmbedding(post.id);
      }

      if (
        uploadedCover &&
        previousCoverImage &&
        previousCoverImage !== uploadedCover.url
      ) {
        await this.uploadService.removeFileByUrl(previousCoverImage);
      }

      return this.findById(post.id);
    } catch (error) {
      await this.uploadService.removeFileByUrl(uploadedCover?.url);
      throw error;
    }
  }

  async remove(id: string, actorId: string, role: AppRole) {
    const post = await this.findPostOrFail(id);
    this.assertCanManagePost(post, actorId, role);

    post.status = 'archived';
    await this.postsRepository.save(post);

    return {
      id: post.id,
      archived: true,
    };
  }

  async publish(id: string, authorId: string) {
    const post = await this.findPostOrFail(id);

    if (post.authorId !== authorId) {
      throw new ForbiddenException('Only the author can publish this post.');
    }

    post.status = 'published';
    post.publishedAt = new Date();
    await this.postsRepository.save(post);
    this.queuePostEmbedding(post.id);

    return this.attachTags(post);
  }

  async getFeed(userId?: string) {
    const builder = this.postsRepository.createQueryBuilder('post');
    builder.where('post.status = :status', {
      status: 'published',
    });

    if (userId) {
      builder.andWhere('post.author_id != :userId', {
        userId,
      });
    }

    const posts = await builder
      .orderBy('post.published_at', 'DESC', 'NULLS LAST')
      .addOrderBy('post.view_count', 'DESC')
      .take(20)
      .getMany();

    return {
      userId: userId ?? null,
      items: await Promise.all(posts.map((post) => this.attachTags(post))),
    };
  }

  async findById(id: string) {
    const post = await this.findPostOrFail(id);
    return this.attachTags(post);
  }

  private generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(
    rawSlugOrTitle: string,
    currentPostId?: string,
  ): Promise<string> {
    const baseSlug = this.generateSlug(rawSlugOrTitle);
    let candidate = baseSlug || 'post';
    let suffix = 1;

    while (true) {
      const existing = await this.postsRepository.findOne({
        where: {
          slug: candidate,
        },
      });

      if (!existing || existing.id === currentPostId) {
        return candidate;
      }

      suffix += 1;
      candidate = `${baseSlug || 'post'}-${suffix}`;
    }
  }

  private async validateCategory(categoryId?: string) {
    if (!categoryId) {
      return;
    }

    const category = await this.categoriesRepository.findOne({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }
  }

  private async validateTags(tagIds?: string[]) {
    if (!tagIds || tagIds.length === 0) {
      return;
    }

    const tags = await this.tagsRepository.findBy({
      id: In([...new Set(tagIds)]),
    });
    if (tags.length !== new Set(tagIds).size) {
      throw new NotFoundException('One or more tags were not found.');
    }
  }

  private async syncTags(postId: string, tagIds?: string[]) {
    await this.postTagsRepository.delete({
      postId,
    });

    if (!tagIds || tagIds.length === 0) {
      return;
    }

    await this.postTagsRepository.save(
      [...new Set(tagIds)].map((tagId) =>
        this.postTagsRepository.create({
          postId,
          tagId,
        }),
      ),
    );
  }

  private async attachTags(post: PostEntity) {
    const postTags = await this.postTagsRepository.find({
      where: {
        postId: post.id,
      },
    });

    let tags: TagEntity[] = [];
    if (postTags.length > 0) {
      tags = await this.tagsRepository.findBy({
        id: In(postTags.map((item) => item.tagId)),
      });
    }

    return {
      ...post,
      tags,
    };
  }

  private assertCanManagePost(
    post: PostEntity,
    actorId: string,
    role: AppRole,
  ) {
    if (post.authorId === actorId || role === 'admin') {
      return;
    }

    throw new ForbiddenException('You do not have permission to modify this post.');
  }

  private async findPostOrFail(id: string): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({
      where: {
        id,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }

  private queuePostEmbedding(postId: string) {
    void this.jobQueueService.enqueuePostEmbedding(postId).catch((error) => {
      this.logger.warn(
        `Unable to enqueue post embedding job for post ${postId}.`,
        error instanceof Error ? error.message : undefined,
      );
    });
  }
}
