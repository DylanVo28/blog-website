import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { JobQueueService } from '../../jobs/job-queue.service';
import { CategoryEntity } from '../posts/entities/category.entity';
import { PostEntity } from '../posts/entities/post.entity';
import { TagEntity } from '../posts/entities/tag.entity';
import { CreatePostDto } from '../posts/dto/create-post.dto';
import { PostsService } from '../posts/posts.service';
import {
  MAX_IMAGE_FILE_SIZE,
  type UploadedImageFile,
  UploadService,
} from '../upload/upload.service';
import { UserEntity } from '../users/entities/user.entity';
import { ListContentAgentRunsDto } from './dto/list-content-agent-runs.dto';
import { UpdateContentAgentConfigDto } from './dto/update-content-agent-config.dto';
import { ContentAgentConfigEntity } from './entities/content-agent-config.entity';
import { ContentAgentResearchItemEntity } from './entities/content-agent-research-item.entity';
import { ContentAgentRunEntity } from './entities/content-agent-run.entity';
import {
  ContentAgentCitation,
  ContentAgentRunStatus,
  ContentAgentTriggerSource,
} from './content-agent.types';

interface TimeZoneParts {
  dateKey: string;
  hour: number;
  minute: number;
}

interface FeedCandidate {
  sourceType: string;
  sourceUrl: string;
  canonicalUrl: string;
  sourceDomain: string;
  title: string;
  summary: string | null;
  contentText: string | null;
  topic: string | null;
  publishedAt: Date | null;
  finalScore: number;
  rankingReasons: Record<string, unknown>;
}

interface CollectedFeedItem {
  sourceType: string;
  sourceUrl: string;
  canonicalUrl: string;
  sourceDomain: string;
  title: string;
  summary: string | null;
  contentText: string | null;
  topic: string | null;
  publishedAt: Date | null;
}

interface DraftSection {
  heading: string;
  paragraphs: string[];
}

interface GeneratedDraft {
  title: string;
  excerpt: string;
  sections: DraftSection[];
  citations: ContentAgentCitation[];
  writerMode: 'ai' | 'fallback';
}

export interface ScheduledRunQueueItem {
  configId: string;
  runId: string;
  scheduledFor: Date;
  triggerSource: ContentAgentTriggerSource;
}

export interface ScheduleDueRunsResult {
  checkedAt: string;
  totalConfigs: number;
  dueConfigs: number;
  acceptedRuns: number;
  runs: ScheduledRunQueueItem[];
  skippedConfigs: Array<{
    configId: string;
    reason: string;
  }>;
}

@Injectable()
export class ContentAgentService {
  private readonly logger = new Logger(ContentAgentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly aiService: AiService,
    private readonly postsService: PostsService,
    private readonly jobQueueService: JobQueueService,
    private readonly uploadService: UploadService,
    @InjectRepository(ContentAgentConfigEntity)
    private readonly configRepository: Repository<ContentAgentConfigEntity>,
    @InjectRepository(ContentAgentRunEntity)
    private readonly runRepository: Repository<ContentAgentRunEntity>,
    @InjectRepository(ContentAgentResearchItemEntity)
    private readonly researchItemRepository: Repository<ContentAgentResearchItemEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tagsRepository: Repository<TagEntity>,
  ) {}

  async listConfigs() {
    const items = await this.configRepository.find({
      order: {
        createdAt: 'ASC',
      },
    });

    return {
      items,
    };
  }

  async updateConfig(configId: string, dto: UpdateContentAgentConfigDto) {
    const config = await this.findConfigOrFail(configId);

    if (dto.name !== undefined) {
      config.name = dto.name;
    }

    if (dto.enabled !== undefined) {
      config.enabled = dto.enabled;
    }

    if (dto.timezone !== undefined) {
      config.timezone = dto.timezone;
    }

    if (dto.scheduleHour !== undefined) {
      config.scheduleHour = dto.scheduleHour;
    }

    if (dto.scheduleMinute !== undefined) {
      config.scheduleMinute = dto.scheduleMinute;
    }

    if (dto.topics !== undefined) {
      config.topics = this.normalizeStringArray(dto.topics);
    }

    if (dto.sourceAllowlist !== undefined) {
      config.sourceAllowlist = this.normalizeStringArray(dto.sourceAllowlist);
    }

    if (dto.publishMode !== undefined) {
      config.publishMode = dto.publishMode;
    }

    if (dto.systemAuthorId !== undefined) {
      config.systemAuthorId = dto.systemAuthorId ?? null;
    }

    if (dto.defaultCategoryId !== undefined) {
      config.defaultCategoryId = dto.defaultCategoryId ?? null;
    }

    if (dto.defaultTagIds !== undefined) {
      config.defaultTagIds = Array.from(new Set(dto.defaultTagIds));
    }

    if (dto.writingStyle !== undefined) {
      config.writingStyle = dto.writingStyle ?? null;
    }

    if (dto.maxArticleAgeHours !== undefined) {
      config.maxArticleAgeHours = dto.maxArticleAgeHours;
    }

    if (dto.maxResearchItems !== undefined) {
      config.maxResearchItems = dto.maxResearchItems;
    }

    await this.validateConfigReferences(config);

    const readiness = this.validateConfigReadiness(config);
    if (config.enabled && !readiness.ready) {
      throw new BadRequestException(readiness.reasons.join(' '));
    }

    return this.configRepository.save(config);
  }

  async listRuns(query: ListContentAgentRunsDto) {
    const limit = query.limit ?? 20;
    const items = await this.runRepository.find({
      where: query.configId
        ? {
            configId: query.configId,
          }
        : undefined,
      order: {
        scheduledFor: 'DESC',
        createdAt: 'DESC',
      },
      take: limit,
    });

    return {
      items: items.map((run) => this.toRunSummary(run)),
    };
  }

  async getRun(runId: string) {
    const run = await this.runRepository.findOne({
      where: {
        id: runId,
      },
    });

    if (!run) {
      throw new NotFoundException('Content agent run not found.');
    }

    const researchItems = await this.researchItemRepository.find({
      where: {
        runId,
      },
      order: {
        isSelected: 'DESC',
        finalScore: 'DESC',
        publishedAt: 'DESC',
      },
    });

    return {
      run,
      researchItems,
    };
  }

  async triggerRun(
    configId: string,
    triggerSource: ContentAgentTriggerSource,
  ) {
    const config = await this.findConfigOrFail(configId);
    const readiness = this.validateConfigReadiness(config);

    if (!readiness.ready) {
      throw new BadRequestException(readiness.reasons.join(' '));
    }

    return this.createAndEnqueueRun(config, triggerSource);
  }

  async triggerScheduledRuns() {
    return this.scheduleDueRuns();
  }

  async scheduleDueRuns(now = new Date()): Promise<ScheduleDueRunsResult> {
    const configs = await this.configRepository.find({
      where: {
        enabled: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
    const runs: ScheduledRunQueueItem[] = [];
    const skippedConfigs: ScheduleDueRunsResult['skippedConfigs'] = [];
    let dueConfigs = 0;

    for (const config of configs) {
      const readiness = this.validateConfigReadiness(config);
      if (!readiness.ready) {
        this.logger.warn(
          `Skipping content agent config ${config.id}: ${readiness.reasons.join(' ')}`,
        );
        skippedConfigs.push({
          configId: config.id,
          reason: readiness.reasons.join(' '),
        });
        continue;
      }

      const parts = this.getTimeZoneParts(now, config.timezone);
      if (
        parts.hour !== config.scheduleHour ||
        parts.minute !== config.scheduleMinute
      ) {
        continue;
      }

      dueConfigs += 1;

      try {
        const queuedRun = await this.createAndEnqueueRun(
          config,
          'schedule',
          parts,
          now,
        );

        runs.push({
          configId: config.id,
          runId: queuedRun.run.id,
          scheduledFor: queuedRun.run.scheduledFor,
          triggerSource: 'schedule',
        });
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : 'Unable to enqueue scheduled content agent run.';
        this.logger.error(
          `Unable to enqueue scheduled content agent run for config ${config.id}.`,
          error instanceof Error ? error.stack : undefined,
        );
        skippedConfigs.push({
          configId: config.id,
          reason,
        });
      }
    }

    return {
      checkedAt: now.toISOString(),
      totalConfigs: configs.length,
      dueConfigs,
      acceptedRuns: runs.length,
      runs,
      skippedConfigs,
    };
  }

  async retryRun(runId: string) {
    const run = await this.findRunOrFail(runId);
    const previousStatus = run.status;

    if (previousStatus !== 'failed' && previousStatus !== 'skipped') {
      throw new BadRequestException(
        'Only failed or skipped content agent runs can be retried.',
      );
    }

    if (run.draftPostId) {
      throw new BadRequestException(
        'This run already created a draft post. Trigger a new run instead of retrying it.',
      );
    }

    const config = await this.findConfigOrFail(run.configId);
    const readiness = this.validateConfigReadiness(config);

    if (!readiness.ready) {
      throw new BadRequestException(readiness.reasons.join(' '));
    }

    await this.researchItemRepository.delete({
      runId,
    });

    run.status = 'queued';
    run.failureReason = null;
    run.selectedResearchItemId = null;
    run.draftPostId = null;
    run.draftTitle = null;
    run.draftExcerpt = null;
    run.draftContent = null;
    run.draftContentPlain = null;
    run.citations = [];
    run.validationResult = {};
    run.metadata = {
      retryRequestedAt: new Date().toISOString(),
      retriedFromStatus: previousStatus,
    };
    run.startedAt = null;
    run.finishedAt = null;
    await this.runRepository.save(run);

    await this.jobQueueService.enqueueContentAgentRun(
      {
        runId: run.id,
        configId: run.configId,
        idempotencyKey: run.idempotencyKey,
        triggerSource: run.triggerSource,
      },
      {
        jobId: `${run.idempotencyKey}:retry:${Date.now()}`,
      },
    );

    return this.getRun(run.id);
  }

  async executeRun(runId: string) {
    const run = await this.claimRun(runId);
    if (!run) {
      return null;
    }

    const config = await this.findConfigOrFail(run.configId);

    try {
      await this.updateRunStatus(run.id, 'researching');
      const candidates = await this.collectCandidates(config);

      if (candidates.length === 0) {
        await this.markRunSkipped(run.id, 'Không tìm thấy bài research phù hợp.');
        await this.notifyAdmins('content_agent_run_failed', {
          configId: config.id,
          configName: config.name,
          runId: run.id,
          reason: 'Không tìm thấy bài research phù hợp.',
        });
        return this.getRun(run.id);
      }

      const storedItems = await this.persistResearchItems(run.id, candidates);
      const selected = storedItems[0];
      await this.updateRunSelection(run.id, selected.id, {
        candidatesCollected: storedItems.length,
      });

      await this.updateRunStatus(run.id, 'generating');
      const draft = await this.generateDraft(
        config,
        selected,
        storedItems.slice(1, 4),
      );

      await this.updateRunStatus(run.id, 'validating');
      const validation = await this.validateDraft(config, draft, selected);
      const draftContent = this.buildTipTapDocument(draft);
      const draftContentPlain = this.buildPlainText(draft);
      const coverImage = await this.resolveDraftCoverImage(selected);

      if (!validation.passed) {
        await this.markRunSkipped(run.id, validation.reasons.join(' '), {
          validationResult: validation,
          citations: draft.citations,
          draftTitle: draft.title,
          draftExcerpt: draft.excerpt,
          draftContent,
          draftContentPlain,
          metadata: {
            writerMode: draft.writerMode,
            selectedResearchUrl: selected.canonicalUrl,
          },
        });
        await this.notifyAdmins('content_agent_run_failed', {
          configId: config.id,
          configName: config.name,
          runId: run.id,
          reason: validation.reasons.join(' '),
        });

        return this.getRun(run.id);
      }

      const createdPost = await this.createDraftPost(config, {
        title: draft.title,
        excerpt: draft.excerpt,
        content: draftContent,
        contentPlain: draftContentPlain,
        coverImage,
      });

      const completedRun = await this.finalizeRunWithDraft(run.id, {
        draftPostId: createdPost.id,
        draftTitle: draft.title,
        draftExcerpt: draft.excerpt,
        draftContent,
        draftContentPlain,
        citations: draft.citations,
        validationResult: validation,
        metadata: {
          writerMode: draft.writerMode,
          selectedResearchUrl: selected.canonicalUrl,
          selectedResearchDomain: selected.sourceDomain,
          coverImage,
        },
      });

      await this.notifyAdmins('content_agent_run_succeeded', {
        configId: config.id,
        configName: config.name,
        runId: run.id,
        postId: createdPost.id,
      });

      return completedRun;
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : 'Unknown content agent error.';
      this.logger.error(
        `Content agent run ${runId} failed.`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.markRunFailed(run.id, failureReason);
      await this.notifyAdmins('content_agent_run_failed', {
        configId: config.id,
        configName: config.name,
        runId: run.id,
        reason: failureReason,
      });
      throw error;
    }
  }

  private async createAndEnqueueRun(
    config: ContentAgentConfigEntity,
    triggerSource: ContentAgentTriggerSource,
    timeZoneParts?: TimeZoneParts,
    scheduledAt?: Date,
  ) {
    const scheduledFor = this.roundToMinute(scheduledAt ?? new Date());
    const parts = timeZoneParts ?? this.getTimeZoneParts(scheduledFor, config.timezone);
    const idempotencyKey = [
      'content-agent',
      config.id,
      parts.dateKey,
      String(parts.hour).padStart(2, '0'),
      String(parts.minute).padStart(2, '0'),
      triggerSource,
    ].join(':');

    const queryResult = (await this.dataSource.query(
      `
        INSERT INTO content_agent_runs (
          config_id,
          scheduled_for,
          trigger_source,
          status,
          idempotency_key,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, 'queued', $4, NOW(), NOW())
        ON CONFLICT (config_id, scheduled_for)
        DO UPDATE SET updated_at = NOW()
        RETURNING id
      `,
      [config.id, scheduledFor.toISOString(), triggerSource, idempotencyKey],
    )) as Array<{ id: string }>;

    const runId = queryResult[0]?.id;
    if (!runId) {
      throw new BadRequestException('Unable to create content agent run.');
    }

    if (triggerSource === 'schedule') {
      config.lastScheduledAt = scheduledFor;
      await this.configRepository.save(config);
    }

    await this.jobQueueService.enqueueContentAgentRun({
      runId,
      configId: config.id,
      idempotencyKey,
      triggerSource,
    });

    return this.getRun(runId);
  }

  private async claimRun(runId: string) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ContentAgentRunEntity);
      const run = await repository.findOne({
        where: {
          id: runId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!run) {
        throw new NotFoundException('Content agent run not found.');
      }

      if (run.status !== 'queued') {
        return null;
      }

      run.status = 'researching';
      run.startedAt = new Date();
      run.failureReason = null;
      run.finishedAt = null;

      return repository.save(run);
    });
  }

  private async updateRunStatus(runId: string, status: ContentAgentRunStatus) {
    await this.runRepository.update(
      {
        id: runId,
      },
      {
        status,
      },
    );
  }

  private async updateRunSelection(
    runId: string,
    selectedResearchItemId: string,
    metadata: Record<string, unknown>,
  ) {
    const run = await this.findRunOrFail(runId);
    run.selectedResearchItemId = selectedResearchItemId;
    run.metadata = metadata;
    await this.runRepository.save(run);
  }

  private async persistResearchItems(runId: string, candidates: FeedCandidate[]) {
    const saved = await this.researchItemRepository.save(
      candidates.map((candidate, index) =>
        this.researchItemRepository.create({
          runId,
          sourceType: candidate.sourceType,
          sourceUrl: candidate.sourceUrl,
          canonicalUrl: candidate.canonicalUrl,
          sourceDomain: candidate.sourceDomain,
          title: this.truncate(candidate.title, 500),
          summary: candidate.summary,
          contentText: candidate.contentText,
          topic: candidate.topic,
          publishedAt: candidate.publishedAt,
          finalScore: candidate.finalScore,
          rankingReasons: candidate.rankingReasons,
          isSelected: index === 0,
        }),
      ),
    );

    return saved.sort((left, right) => right.finalScore - left.finalScore);
  }

  private async generateDraft(
    config: ContentAgentConfigEntity,
    selected: ContentAgentResearchItemEntity,
    supporting: ContentAgentResearchItemEntity[],
  ): Promise<GeneratedDraft> {
    const aiDraft = await this.generateDraftWithAi(config, selected, supporting).catch(
      (error) => {
        this.logger.warn(
          `Falling back to deterministic writer for run candidate ${selected.id}.`,
          error instanceof Error ? error.message : undefined,
        );
        return null;
      },
    );

    if (aiDraft) {
      return aiDraft;
    }

    return this.generateFallbackDraft(config, selected, supporting);
  }

  private async resolveDraftCoverImage(
    selected: ContentAgentResearchItemEntity,
  ): Promise<string | null> {
    try {
      const sourceImageUrl = await this.extractArticleCoverImageUrl(
        selected.canonicalUrl,
      );

      if (!sourceImageUrl) {
        return null;
      }

      try {
        return await this.persistRemoteImage(sourceImageUrl, selected.title);
      } catch (error) {
        this.logger.warn(
          `Unable to persist remote cover image for ${selected.canonicalUrl}. Falling back to source URL.`,
          error instanceof Error ? error.message : undefined,
        );
        return sourceImageUrl;
      }
    } catch (error) {
      this.logger.warn(
        `Unable to resolve cover image for ${selected.canonicalUrl}.`,
        error instanceof Error ? error.message : undefined,
      );
      return null;
    }
  }

  private async generateDraftWithAi(
    config: ContentAgentConfigEntity,
    selected: ContentAgentResearchItemEntity,
    supporting: ContentAgentResearchItemEntity[],
  ): Promise<GeneratedDraft | null> {
    const supportingContext = supporting.map((item) => ({
      title: item.title,
      url: item.canonicalUrl,
      summary: item.summary,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      domain: item.sourceDomain,
    }));

    const response = await this.aiService.generateText({
      systemPrompt: [
        'You are the editorial AI for a Vietnamese blog platform.',
        'Write in Vietnamese.',
        'Return valid JSON only, no markdown fences.',
        'Do not copy source text verbatim.',
        'Every section must be grounded in the supplied sources.',
        'JSON schema:',
        '{"title":"string","excerpt":"string","sections":[{"heading":"string","paragraphs":["string"]}],"citations":[{"title":"string","url":"string","domain":"string"}]}',
      ].join('\n'),
      userPrompt: JSON.stringify(
        {
          topics: config.topics,
          writingStyle:
            config.writingStyle ??
            'Súc tích, rõ ràng, thiên về tổng hợp tin mới cho độc giả công nghệ.',
          selectedSource: {
            title: selected.title,
            url: selected.canonicalUrl,
            summary: selected.summary,
            contentText: selected.contentText,
            publishedAt: selected.publishedAt?.toISOString() ?? null,
            domain: selected.sourceDomain,
          },
          supportingSources: supportingContext,
          requirements: {
            sectionCount: 3,
            paragraphPerSection: '1-2',
            excerptMaxLength: 240,
          },
        },
        null,
        2,
      ),
      maxTokens: 1200,
      temperature: 0.35,
    });

    const parsed = this.parseGeneratedDraft(response.text);
    if (!parsed) {
      return null;
    }

    return {
      ...parsed,
      writerMode: 'ai',
    };
  }

  private generateFallbackDraft(
    config: ContentAgentConfigEntity,
    selected: ContentAgentResearchItemEntity,
    supporting: ContentAgentResearchItemEntity[],
  ): GeneratedDraft {
    const topic = selected.topic ?? config.topics[0] ?? 'tin mới';
    const selectedSummary =
      selected.summary ??
      'Nguồn chính cho thấy một diễn biến mới đáng chú ý trong chủ đề này.';
    const supportingParagraph =
      supporting.length > 0
        ? `Các nguồn liên quan như ${supporting
            .map((item) => item.sourceDomain)
            .slice(0, 3)
            .join(', ')} đang cho thấy cùng một hướng diễn biến, giúp củng cố độ tin cậy cho nhận định chính.`
        : 'Hiện chưa có nhiều nguồn bổ trợ, nên bài viết tập trung vào thông tin đã xuất hiện rõ ràng trong nguồn chính.';

    const sections: DraftSection[] = [
      {
        heading: 'Điểm mới đáng chú ý',
        paragraphs: [
          selectedSummary,
          `Nguồn ${selected.sourceDomain} đăng tải nội dung này ${
            selected.publishedAt
              ? `vào ${selected.publishedAt.toISOString()}`
              : 'trong khung thời gian gần đây'
          }, nên đây là một tín hiệu mới phù hợp để theo dõi trong chủ đề ${topic}.`,
        ],
      },
      {
        heading: 'Vì sao nội dung này quan trọng',
        paragraphs: [
          `Từ góc nhìn biên tập, thông tin mới liên quan đến ${topic} đáng chú ý vì nó phản ánh xu hướng đang thay đổi và có thể tác động trực tiếp tới người đọc của website.`,
          supportingParagraph,
        ],
      },
      {
        heading: 'Điều cần theo dõi tiếp',
        paragraphs: [
          'Ở giai đoạn Phase 1, bài viết này được tạo dưới dạng draft để editor có thể rà lại dữ kiện, tiêu đề và góc triển khai trước khi publish.',
          'Nếu các nguồn tiếp tục cập nhật trong vài giờ tới, editor có thể bổ sung số liệu hoặc bối cảnh để hoàn thiện bản thảo này.',
        ],
      },
    ];

    const citations = [
      {
        title: selected.title,
        url: selected.canonicalUrl,
        domain: selected.sourceDomain,
      },
      ...supporting.slice(0, 2).map((item) => ({
        title: item.title,
        url: item.canonicalUrl,
        domain: item.sourceDomain,
      })),
    ];

    return {
      title: this.truncate(selected.title, 500),
      excerpt: this.truncate(
        `Bản nháp tổng hợp nhanh về ${topic}, được AI agent chuẩn bị từ nguồn ${selected.sourceDomain} để editor rà soát trước khi publish.`,
        500,
      ),
      sections,
      citations,
      writerMode: 'fallback',
    };
  }

  private async validateDraft(
    config: ContentAgentConfigEntity,
    draft: GeneratedDraft,
    selected: ContentAgentResearchItemEntity,
  ) {
    const reasons: string[] = [];
    const plainText = this.buildPlainText(draft);

    if (!draft.title.trim()) {
      reasons.push('Draft không có tiêu đề.');
    }

    if (!draft.excerpt.trim()) {
      reasons.push('Draft không có excerpt.');
    }

    if (plainText.length < 450) {
      reasons.push('Draft quá ngắn để lưu thành bài viết.');
    }

    if (draft.citations.length === 0) {
      reasons.push('Draft không có nguồn tham chiếu.');
    }

    const recentPosts = await this.postsRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 50,
    });

    const normalizedTitle = this.normalizeText(draft.title);
    const duplicateTitle = recentPosts.find((post) => {
      const score = this.calculateSimilarity(
        normalizedTitle,
        this.normalizeText(post.title),
      );
      return score >= 0.82;
    });

    if (duplicateTitle) {
      reasons.push(`Tiêu đề draft quá giống bài hiện có "${duplicateTitle.title}".`);
    }

    const sourceResearchItemIds = await this.findResearchItemIdsByCanonicalUrl(
      selected.canonicalUrl,
    );
    const recentRunWithSameSource =
      sourceResearchItemIds.length > 0
        ? await this.runRepository.findOne({
            where: {
              selectedResearchItemId: In(sourceResearchItemIds),
            },
            order: {
              createdAt: 'DESC',
            },
          })
        : null;

    if (recentRunWithSameSource && recentRunWithSameSource.id !== selected.runId) {
      reasons.push('Nguồn chính đã được dùng cho một run trước đó.');
    }

    return {
      passed: reasons.length === 0,
      reasons,
      publishMode: config.publishMode,
      selectedSource: selected.canonicalUrl,
      writerMode: draft.writerMode,
    };
  }

  private async createDraftPost(
    config: ContentAgentConfigEntity,
    input: {
      title: string;
      excerpt: string;
      content: Record<string, unknown>;
      contentPlain: string;
      coverImage?: string | null;
    },
  ) {
    if (!config.systemAuthorId) {
      throw new BadRequestException('Content agent config is missing systemAuthorId.');
    }

    const dto: CreatePostDto = {
      title: this.truncate(input.title, 500),
      content: input.content,
      contentPlain: input.contentPlain,
      excerpt: this.truncate(input.excerpt, 500),
      coverImage: input.coverImage ?? undefined,
      categoryId: config.defaultCategoryId ?? undefined,
      tagIds: config.defaultTagIds,
    };

    return this.postsService.create(config.systemAuthorId, dto);
  }

  private async finalizeRunWithDraft(
    runId: string,
    input: {
      draftPostId: string;
      draftTitle: string;
      draftExcerpt: string;
      draftContent: Record<string, unknown>;
      draftContentPlain: string;
      citations: ContentAgentCitation[];
      validationResult: Record<string, unknown>;
      metadata: Record<string, unknown>;
    },
  ) {
    const run = await this.findRunOrFail(runId);
    run.status = 'draft_created';
    run.draftPostId = input.draftPostId;
    run.draftTitle = input.draftTitle;
    run.draftExcerpt = input.draftExcerpt;
    run.draftContent = input.draftContent;
    run.draftContentPlain = input.draftContentPlain;
    run.citations = input.citations;
    run.validationResult = input.validationResult;
    run.metadata = input.metadata;
    run.finishedAt = new Date();
    run.failureReason = null;
    await this.runRepository.save(run);

    return this.getRun(runId);
  }

  private async markRunSkipped(
    runId: string,
    reason: string,
    extras?: Partial<ContentAgentRunEntity>,
  ) {
    const run = await this.findRunOrFail(runId);
    run.status = 'skipped';
    run.failureReason = reason;
    run.finishedAt = new Date();

    if (extras?.validationResult !== undefined) {
      run.validationResult = extras.validationResult;
    }

    if (extras?.citations !== undefined) {
      run.citations = extras.citations;
    }

    if (extras?.draftTitle !== undefined) {
      run.draftTitle = extras.draftTitle;
    }

    if (extras?.draftExcerpt !== undefined) {
      run.draftExcerpt = extras.draftExcerpt;
    }

    if (extras?.draftContent !== undefined) {
      run.draftContent = extras.draftContent;
    }

    if (extras?.draftContentPlain !== undefined) {
      run.draftContentPlain = extras.draftContentPlain;
    }

    if (extras?.metadata !== undefined) {
      run.metadata = extras.metadata;
    }

    await this.runRepository.save(run);
  }

  private async markRunFailed(runId: string, reason: string) {
    await this.runRepository.update(
      {
        id: runId,
      },
      {
        status: 'failed',
        failureReason: reason,
        finishedAt: new Date(),
      },
    );
  }

  private async collectCandidates(config: ContentAgentConfigEntity) {
    const results = await Promise.allSettled(
      config.sourceAllowlist.map((sourceUrl) => this.collectSource(sourceUrl, config)),
    );

    const deduped = new Map<string, FeedCandidate>();

    for (const result of results) {
      if (result.status !== 'fulfilled') {
        this.logger.warn(
          `Unable to collect a configured feed source: ${result.reason instanceof Error ? result.reason.message : 'unknown error'}`,
        );
        continue;
      }

      for (const candidate of result.value) {
        const key = candidate.canonicalUrl || `${candidate.title}:${candidate.sourceDomain}`;
        const existing = deduped.get(key);
        if (!existing || candidate.finalScore > existing.finalScore) {
          deduped.set(key, candidate);
        }
      }
    }

    return Array.from(deduped.values())
      .sort((left, right) => right.finalScore - left.finalScore)
      .slice(0, config.maxResearchItems);
  }

  private async collectSource(sourceUrl: string, config: ContentAgentConfigEntity) {
    const response = await this.fetchText(sourceUrl);
    const feedItems = this.parseFeed(response, sourceUrl);
    const cutoffTime = Date.now() - config.maxArticleAgeHours * 60 * 60 * 1000;

    return feedItems
      .map((item) => this.rankFeedItem(item, config))
      .filter((item): item is FeedCandidate => Boolean(item))
      .filter((item) => {
        if (!item.publishedAt) {
          return true;
        }

        return item.publishedAt.getTime() >= cutoffTime;
      });
  }

  private rankFeedItem(
    item: Omit<FeedCandidate, 'finalScore' | 'rankingReasons'>,
    config: ContentAgentConfigEntity,
  ): FeedCandidate | null {
    const title = item.title.trim();
    if (!title) {
      return null;
    }

    const text = [item.title, item.summary, item.contentText]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' ');
    const normalizedText = this.normalizeText(text);
    const topicMatches = config.topics
      .map((topic) => ({
        topic,
        score: this.calculateSimilarity(
          normalizedText,
          this.normalizeText(topic),
        ),
      }))
      .sort((left, right) => right.score - left.score);

    const bestTopic = topicMatches[0];
    const relevanceScore = bestTopic?.score ?? 0;
    const recencyScore = this.calculateRecencyScore(
      item.publishedAt,
      config.maxArticleAgeHours,
    );
    const credibilityScore = this.calculateCredibilityScore(item.sourceUrl);
    const finalScore =
      recencyScore * 0.45 + relevanceScore * 0.4 + credibilityScore * 0.15;

    if (relevanceScore <= 0 && config.topics.length > 0) {
      return null;
    }

    return {
      ...item,
      topic: bestTopic?.topic ?? item.topic,
      finalScore: Number(finalScore.toFixed(4)),
      rankingReasons: {
        recencyScore: Number(recencyScore.toFixed(4)),
        relevanceScore: Number(relevanceScore.toFixed(4)),
        credibilityScore: Number(credibilityScore.toFixed(4)),
        matchedTopic: bestTopic?.topic ?? null,
      },
    };
  }

  private buildTipTapDocument(draft: GeneratedDraft): Record<string, unknown> {
    const content: Array<Record<string, unknown>> = [];

    for (const section of draft.sections) {
      content.push({
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: section.heading,
          },
        ],
      });

      for (const paragraph of section.paragraphs) {
        content.push({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: paragraph,
            },
          ],
        });
      }
    }

    if (draft.citations.length > 0) {
      content.push({
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'Nguon tham khao',
          },
        ],
      });

      content.push({
        type: 'bulletList',
        content: draft.citations.map((citation) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `${citation.title} - ${citation.url}`,
                },
              ],
            },
          ],
        })),
      });
    }

    return {
      type: 'doc',
      content,
    };
  }

  private buildPlainText(draft: GeneratedDraft) {
    const sections = draft.sections
      .flatMap((section) => [section.heading, ...section.paragraphs])
      .join('\n\n');
    const citations = draft.citations
      .map((citation) => `${citation.title}: ${citation.url}`)
      .join('\n');

    return [draft.title, draft.excerpt, sections, citations]
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }

  private async validateConfigReferences(config: ContentAgentConfigEntity) {
    if (config.systemAuthorId) {
      const user = await this.usersRepository.findOne({
        where: {
          id: config.systemAuthorId,
        },
      });

      if (!user) {
        throw new NotFoundException('System author was not found.');
      }

      if (!['author', 'admin'].includes(user.role)) {
        throw new BadRequestException(
          'System author must have author or admin role.',
        );
      }
    }

    if (config.defaultCategoryId) {
      const category = await this.categoriesRepository.findOne({
        where: {
          id: config.defaultCategoryId,
        },
      });

      if (!category) {
        throw new NotFoundException('Default category was not found.');
      }
    }

    if (config.defaultTagIds.length > 0) {
      const tags = await this.tagsRepository.findBy({
        id: In(config.defaultTagIds),
      });

      if (tags.length !== new Set(config.defaultTagIds).size) {
        throw new NotFoundException('One or more default tags were not found.');
      }
    }
  }

  private validateConfigReadiness(config: ContentAgentConfigEntity) {
    const reasons: string[] = [];

    if (!config.systemAuthorId) {
      reasons.push('Chua cau hinh system author cho content agent.');
    }

    if (config.sourceAllowlist.length === 0) {
      reasons.push('Chua co source allowlist cho content agent.');
    }

    if (config.topics.length === 0) {
      reasons.push('Chua cau hinh topics cho content agent.');
    }

    return {
      ready: reasons.length === 0,
      reasons,
    };
  }

  private async notifyAdmins(
    type: 'content_agent_run_succeeded' | 'content_agent_run_failed',
    payload: Record<string, unknown>,
  ) {
    const admins = await this.usersRepository.find({
      where: {
        role: 'admin',
      },
      take: 20,
    });

    await Promise.all(
      admins.map((admin) =>
        this.jobQueueService.enqueueNotification({
          type,
          recipientId: admin.id,
          payload,
        }),
      ),
    );
  }

  private async findConfigOrFail(configId: string) {
    const config = await this.configRepository.findOne({
      where: {
        id: configId,
      },
    });

    if (!config) {
      throw new NotFoundException('Content agent config not found.');
    }

    return config;
  }

  private async findRunOrFail(runId: string) {
    const run = await this.runRepository.findOne({
      where: {
        id: runId,
      },
    });

    if (!run) {
      throw new NotFoundException('Content agent run not found.');
    }

    return run;
  }

  private toRunSummary(run: ContentAgentRunEntity) {
    return {
      id: run.id,
      configId: run.configId,
      scheduledFor: run.scheduledFor,
      triggerSource: run.triggerSource,
      status: run.status,
      failureReason: run.failureReason,
      selectedResearchItemId: run.selectedResearchItemId,
      draftPostId: run.draftPostId,
      draftTitle: run.draftTitle,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }

  private async findResearchItemIdsByCanonicalUrl(canonicalUrl: string) {
    const items = await this.researchItemRepository.find({
      select: {
        id: true,
      },
      where: {
        canonicalUrl,
      },
      take: 20,
    });

    return items.map((item) => item.id);
  }

  private parseGeneratedDraft(raw: string): Omit<GeneratedDraft, 'writerMode'> | null {
    const normalized = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');

    try {
      const parsed = JSON.parse(normalized) as {
        title?: unknown;
        excerpt?: unknown;
        sections?: unknown;
        citations?: unknown;
      };

      const sections = Array.isArray(parsed.sections)
        ? parsed.sections
            .map((section) => {
              if (!section || typeof section !== 'object') {
                return null;
              }

              const typedSection = section as {
                heading?: unknown;
                paragraphs?: unknown;
              };
              const heading =
                typeof typedSection.heading === 'string'
                  ? typedSection.heading.trim()
                  : '';
              const paragraphs = Array.isArray(typedSection.paragraphs)
                ? typedSection.paragraphs
                    .filter((value): value is string => typeof value === 'string')
                    .map((value) => value.trim())
                    .filter(Boolean)
                : [];

              if (!heading || paragraphs.length === 0) {
                return null;
              }

              return {
                heading: this.truncate(heading, 180),
                paragraphs: paragraphs.map((paragraph) =>
                  this.truncate(paragraph, 1200),
                ),
              };
            })
            .filter((value): value is DraftSection => Boolean(value))
        : [];

      const citations = Array.isArray(parsed.citations)
        ? parsed.citations
            .map((citation) => {
              if (!citation || typeof citation !== 'object') {
                return null;
              }

              const typedCitation = citation as {
                title?: unknown;
                url?: unknown;
                domain?: unknown;
              };

              if (
                typeof typedCitation.title !== 'string' ||
                typeof typedCitation.url !== 'string'
              ) {
                return null;
              }

              return {
                title: this.truncate(typedCitation.title.trim(), 300),
                url: typedCitation.url.trim(),
                domain:
                  typeof typedCitation.domain === 'string'
                    ? typedCitation.domain.trim()
                    : this.safeHostname(typedCitation.url.trim()),
              };
            })
            .filter((value): value is ContentAgentCitation => Boolean(value))
        : [];

      if (
        typeof parsed.title !== 'string' ||
        typeof parsed.excerpt !== 'string' ||
        sections.length === 0
      ) {
        return null;
      }

      return {
        title: this.truncate(parsed.title.trim(), 500),
        excerpt: this.truncate(parsed.excerpt.trim(), 500),
        sections,
        citations,
      };
    } catch {
      return null;
    }
  }

  private async fetchText(url: string) {
    return this.fetchTextResource(url, {
      accept:
        'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
      resourceName: 'resource',
    });
  }

  private async fetchHtml(url: string) {
    return this.fetchTextResource(url, {
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      resourceName: 'article',
    });
  }

  private async fetchTextResource(
    url: string,
    options: {
      accept: string;
      resourceName: string;
    },
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'InklineContentAgent/1.0',
          accept: options.accept,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BadRequestException(
          `Unable to fetch ${options.resourceName}: ${url}`,
        );
      }

      return response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseFeed(xml: string, sourceUrl: string): CollectedFeedItem[] {
    const itemBlocks =
      this.matchBlocks(xml, 'item').length > 0
        ? this.matchBlocks(xml, 'item')
        : this.matchBlocks(xml, 'entry');
    const items: CollectedFeedItem[] = [];

    for (const block of itemBlocks) {
      const title = this.readXmlTag(block, 'title');
      const link = this.readLink(block);

      if (!title || !link) {
        continue;
      }

      const description =
        this.readXmlTag(block, 'description') ??
        this.readXmlTag(block, 'summary') ??
        this.readXmlTag(block, 'content:encoded') ??
        this.readXmlTag(block, 'content');
      const publishedAtRaw =
        this.readXmlTag(block, 'pubDate') ??
        this.readXmlTag(block, 'published') ??
        this.readXmlTag(block, 'updated');

      const canonicalUrl = this.normalizeUrl(link);

      items.push({
        sourceType: 'rss',
        sourceUrl,
        canonicalUrl,
        sourceDomain: this.safeHostname(canonicalUrl),
        title: this.stripHtml(title),
        summary: description ? this.stripHtml(description) : null,
        contentText: description ? this.stripHtml(description) : null,
        topic: null,
        publishedAt: this.parseDate(publishedAtRaw),
      });
    }

    return items;
  }

  private matchBlocks(xml: string, tag: string) {
    const pattern = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi');
    return [...xml.matchAll(pattern)].map((match) => match[0]);
  }

  private readXmlTag(block: string, tag: string) {
    const escaped = tag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i');
    const match = block.match(pattern);

    if (!match?.[1]) {
      return null;
    }

    return this.decodeXmlEntities(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim());
  }

  private readLink(block: string) {
    const direct = this.readXmlTag(block, 'link');
    if (direct && /^https?:\/\//i.test(direct)) {
      return direct;
    }

    const hrefMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
    return hrefMatch?.[1] ?? null;
  }

  private async extractArticleCoverImageUrl(articleUrl: string) {
    const html = await this.fetchHtml(articleUrl);
    const candidates = [
      this.readMetaTagContent(html, 'property', 'og:image:secure_url'),
      this.readMetaTagContent(html, 'property', 'og:image:url'),
      this.readMetaTagContent(html, 'property', 'og:image'),
      this.readMetaTagContent(html, 'name', 'twitter:image'),
      this.readMetaTagContent(html, 'property', 'twitter:image'),
      this.readLinkTagHref(html, 'image_src'),
    ];

    for (const candidate of candidates) {
      const normalized = this.toAbsoluteUrl(candidate, articleUrl);

      if (normalized && this.isHttpUrl(normalized)) {
        return normalized;
      }
    }

    return null;
  }

  private readMetaTagContent(
    html: string,
    attribute: 'property' | 'name',
    key: string,
  ) {
    const escapedKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const patterns = [
      new RegExp(
        `<meta[^>]*${attribute}=["']${escapedKey}["'][^>]*content=["']([^"']+)["'][^>]*>`,
        'i',
      ),
      new RegExp(
        `<meta[^>]*content=["']([^"']+)["'][^>]*${attribute}=["']${escapedKey}["'][^>]*>`,
        'i',
      ),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);

      if (match?.[1]) {
        return this.decodeXmlEntities(match[1].trim());
      }
    }

    return null;
  }

  private readLinkTagHref(html: string, rel: string) {
    const escapedRel = rel.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const patterns = [
      new RegExp(
        `<link[^>]*rel=["']${escapedRel}["'][^>]*href=["']([^"']+)["'][^>]*>`,
        'i',
      ),
      new RegExp(
        `<link[^>]*href=["']([^"']+)["'][^>]*rel=["']${escapedRel}["'][^>]*>`,
        'i',
      ),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);

      if (match?.[1]) {
        return this.decodeXmlEntities(match[1].trim());
      }
    }

    return null;
  }

  private async persistRemoteImage(
    imageUrl: string,
    title: string,
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(imageUrl, {
        headers: {
          'user-agent': 'InklineContentAgent/1.0',
          accept:
            'image/avif,image/webp,image/jpeg,image/png,image/gif,image/svg+xml,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BadRequestException(`Unable to fetch image: ${imageUrl}`);
      }

      const declaredLength = Number(response.headers.get('content-length') ?? '0');
      if (declaredLength > MAX_IMAGE_FILE_SIZE) {
        throw new BadRequestException('Remote image exceeds the 10MB upload limit.');
      }

      const contentType = this.normalizeContentType(
        response.headers.get('content-type'),
      );
      const buffer = Buffer.from(await response.arrayBuffer());

      if (buffer.length === 0) {
        throw new BadRequestException('Remote image is empty.');
      }

      if (buffer.length > MAX_IMAGE_FILE_SIZE) {
        throw new BadRequestException('Remote image exceeds the 10MB upload limit.');
      }

      const upload = await this.uploadService.uploadImage(
        {
          originalname: this.buildRemoteImageFileName(imageUrl, title),
          mimetype: contentType,
          size: buffer.length,
          buffer,
        } satisfies UploadedImageFile,
        'posts',
      );

      return upload.url;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildRemoteImageFileName(imageUrl: string, title: string) {
    try {
      const parsedUrl = new URL(imageUrl);
      const fileName = parsedUrl.pathname.split('/').filter(Boolean).pop();

      if (fileName) {
        return fileName;
      }
    } catch {
      // Ignore invalid URLs and fall through to the generated name.
    }

    const normalizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${normalizedTitle || 'content-agent-cover'}.jpg`;
  }

  private normalizeContentType(value: string | null) {
    return (value ?? 'image/jpeg').split(';')[0].trim().toLowerCase();
  }

  private toAbsoluteUrl(value: string | null, baseUrl: string) {
    if (!value?.trim()) {
      return null;
    }

    try {
      return new URL(value.trim(), baseUrl).toString();
    } catch {
      return null;
    }
  }

  private isHttpUrl(value: string) {
    return /^https?:\/\//i.test(value);
  }

  private decodeXmlEntities(value: string) {
    return value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  private stripHtml(value: string) {
    return this.decodeXmlEntities(value)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeUrl(value: string) {
    try {
      const url = new URL(value);
      const removableParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'gclid',
      ];

      for (const param of removableParams) {
        url.searchParams.delete(param);
      }

      return url.toString();
    } catch {
      return value.trim();
    }
  }

  private safeHostname(value: string) {
    try {
      return new URL(value).hostname;
    } catch {
      return 'unknown-source';
    }
  }

  private parseDate(value: string | null) {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private calculateRecencyScore(date: Date | null, maxAgeHours: number) {
    if (!date) {
      return 0.35;
    }

    const ageHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    return Math.max(0, 1 - ageHours / maxAgeHours);
  }

  private calculateCredibilityScore(sourceUrl: string) {
    try {
      const url = new URL(sourceUrl);
      return url.protocol === 'https:' ? 1 : 0.8;
    } catch {
      return 0.6;
    }
  }

  private calculateSimilarity(left: string, right: string) {
    const leftTokens = new Set(left.split(/\s+/).filter(Boolean));
    const rightTokens = new Set(right.split(/\s+/).filter(Boolean));

    if (leftTokens.size === 0 || rightTokens.size === 0) {
      return 0;
    }

    const intersection = [...leftTokens].filter((token) => rightTokens.has(token))
      .length;
    const union = new Set([...leftTokens, ...rightTokens]).size;

    return union === 0 ? 0 : intersection / union;
  }

  private normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeStringArray(values: string[]) {
    return Array.from(
      new Set(
        values
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );
  }

  private roundToMinute(value: Date) {
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
        value.getUTCHours(),
        value.getUTCMinutes(),
        0,
        0,
      ),
    );
  }

  private getTimeZoneParts(value: Date, timeZone: string): TimeZoneParts {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(value);
    const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
    const month = Number(parts.find((part) => part.type === 'month')?.value ?? '0');
    const day = Number(parts.find((part) => part.type === 'day')?.value ?? '0');
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
    const minute = Number(
      parts.find((part) => part.type === 'minute')?.value ?? '0',
    );

    return {
      dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      hour,
      minute,
    };
  }

  private truncate(value: string, maxLength: number) {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 1).trim()}…`;
  }
}
