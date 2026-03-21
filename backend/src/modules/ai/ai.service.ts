import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JobQueueService } from '../../jobs/job-queue.service';
import { PostEntity } from '../posts/entities/post.entity';
import { QuestionEntity } from '../questions/entities/question.entity';
import { AiQuestionDto } from './dto/ai-question.dto';
import { AuthorDocumentEntity } from './entities/author-document.entity';
import { DocumentEmbeddingEntity } from './entities/document-embedding.entity';
import { PostEmbeddingEntity } from './entities/post-embedding.entity';
import { ChunkingService } from './rag/chunking.service';
import { EmbeddingService } from './rag/embedding.service';
import { RetrievalContext, RetrievalService } from './rag/retrieval.service';

interface AnthropicMessageResponse {
  id: string;
  model: string;
  role: 'assistant';
  stop_reason: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  content: Array<
    | {
        type: 'text';
        text: string;
      }
    | {
        type: string;
      }
  >;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly jobQueueService: JobQueueService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly retrievalService: RetrievalService,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questionsRepository: Repository<QuestionEntity>,
    @InjectRepository(AuthorDocumentEntity)
    private readonly authorDocumentsRepository: Repository<AuthorDocumentEntity>,
  ) {}

  async ask(dto: AiQuestionDto) {
    const questionEmbedding = await this.embeddingService.embed(dto.question);
    const contexts = await this.retrievalService.searchRelevantContext({
      ...dto,
      vector: questionEmbedding.vector,
    });
    const anthropicResponse = await this.createAnthropicMessage(dto, contexts);
    const answer = this.extractTextContent(anthropicResponse.content);

    return {
      provider: 'anthropic',
      model: anthropicResponse.model,
      answer,
      stopReason: anthropicResponse.stop_reason,
      usage: anthropicResponse.usage ?? null,
      contexts,
      embeddingPreview: {
        provider: questionEmbedding.provider,
        model: questionEmbedding.model,
        dimensions: questionEmbedding.dimensions,
        vectorPreview: questionEmbedding.vectorPreview,
      },
    };
  }

  async answerQuestion(
    questionId: string,
    postId: string,
    content: string,
    authorId: string,
  ) {
    const question = await this.questionsRepository.findOne({
      where: {
        id: questionId,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found for AI answer.');
    }

    if (question.status !== 'pending') {
      return question;
    }

    const result = await this.ask({
      question: content,
      postId,
      authorId,
    });

    question.answer = result.answer;
    question.answeredBy = null;
    question.answeredAt = new Date();
    question.status = 'answered';

    return this.questionsRepository.save(question);
  }

  async indexPost(postId: string) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found for indexing.');
    }

    const postText = this.buildPostText(post);
    const chunks = this.chunkingService.chunk(postText, 700);
    const embeddings = await this.embeddingService.embedMany(chunks);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(PostEmbeddingEntity, {
        postId,
      });

      for (const [index, embedding] of embeddings.entries()) {
        await manager.query(
          `
            INSERT INTO post_embeddings (
              post_id,
              chunk_index,
              chunk_text,
              embedding,
              metadata
            )
            VALUES ($1, $2, $3, $4::vector, $5::jsonb)
          `,
          [
            postId,
            index,
            chunks[index],
            embedding.vectorLiteral,
            JSON.stringify({
              title: post.title,
              authorId: post.authorId,
              chunkIndex: index,
              source: 'post',
            }),
          ],
        );
      }
    });

    return {
      postId,
      chunkCount: chunks.length,
      embeddingDimensions:
        embeddings[0]?.dimensions ??
        (this.configService.get<number>('ai.embeddingDimensions') ?? 768),
    };
  }

  async uploadAuthorDocument(
    authorId: string,
    fileName: string,
    content = '',
    postId?: string,
  ) {
    const chunks = this.chunkingService.chunk(content);
    let document = await this.authorDocumentsRepository.save(
      this.authorDocumentsRepository.create({
        authorId,
        postId: postId ?? null,
        fileName,
        contentPlain: content || null,
        isProcessed: false,
      }),
    );

    let indexedChunks = 0;
    let embeddingQueued = false;
    let embeddingJobId: string | null = null;
    if (content.trim()) {
      try {
        const job = await this.jobQueueService.enqueueAuthorDocumentEmbedding(
          document.id,
        );
        embeddingQueued = true;
        embeddingJobId = job.id ?? null;
      } catch (error) {
        this.logger.warn(
          `Unable to enqueue author document embedding job for document ${document.id}.`,
          error instanceof Error ? error.message : undefined,
        );
      }
    }

    return {
      ...document,
      chunks,
      chunkCount: chunks.length,
      indexedChunks,
      embeddingQueued,
      embeddingJobId,
    };
  }

  async indexAuthorDocument(documentId: string) {
    const document = await this.authorDocumentsRepository.findOne({
      where: {
        id: documentId,
      },
    });

    if (!document) {
      throw new NotFoundException('Author document not found for indexing.');
    }

    const chunks = this.chunkingService.chunk(document.contentPlain ?? '', 700);
    const embeddings = await this.embeddingService.embedMany(chunks);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(DocumentEmbeddingEntity, {
        documentId,
      });

      for (const [index, embedding] of embeddings.entries()) {
        await manager.query(
          `
            INSERT INTO document_embeddings (
              document_id,
              author_id,
              chunk_index,
              chunk_text,
              embedding
            )
            VALUES ($1, $2, $3, $4, $5::vector)
          `,
          [
            document.id,
            document.authorId,
            index,
            chunks[index],
            embedding.vectorLiteral,
          ],
        );
      }
    });

    document.isProcessed = chunks.length > 0;
    const savedDocument = await this.authorDocumentsRepository.save(document);

    return {
      document: savedDocument,
      chunkCount: chunks.length,
      embeddingDimensions:
        embeddings[0]?.dimensions ??
        (this.configService.get<number>('ai.embeddingDimensions') ?? 768),
    };
  }

  async listAuthorDocuments(authorId: string) {
    const items = await this.authorDocumentsRepository.find({
      where: {
        authorId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      authorId,
      items,
    };
  }

  async deleteAuthorDocument(authorId: string, documentId: string) {
    const document = await this.authorDocumentsRepository.findOne({
      where: {
        id: documentId,
        authorId,
      },
    });

    if (!document) {
      throw new NotFoundException('Author document not found.');
    }

    await this.authorDocumentsRepository.remove(document);

    return {
      authorId,
      documentId,
      deleted: true,
    };
  }

  private async createAnthropicMessage(
    dto: AiQuestionDto,
    contexts: RetrievalContext[],
  ): Promise<AnthropicMessageResponse> {
    const apiKey = this.configService.get<string>('ai.apiKey');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Anthropic API key is missing. Set ANTHROPIC_API_KEY in the environment.',
      );
    }

    const model =
      this.configService.get<string>('ai.model') ?? 'claude-opus-4.6';
    const apiVersion =
      this.configService.get<string>('ai.apiVersion') ?? '2023-06-01';
    const maxTokens = this.configService.get<number>('ai.maxTokens') ?? 1024;
    const temperature =
      this.configService.get<number>('ai.temperature') ?? 0.2;
    const timeoutMs = this.configService.get<number>('ai.timeoutMs') ?? 30000;
    const baseUrl =
      this.configService.get<string>('ai.baseUrl') ?? 'https://api.anthropic.com';
    const endpoint = this.buildMessagesEndpoint(baseUrl);

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.buildAuthHeaders({
          apiKey,
          apiVersion,
          baseUrl,
        }),
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system: this.buildSystemPrompt(contexts),
          messages: [
            {
              role: 'user',
              content: this.buildUserPrompt(dto, contexts),
            },
          ],
        }),
        signal: abortController.signal,
      });

      const requestId = response.headers.get('request-id');
      const rawBody = await response.text();
      const parsedBody = rawBody ? JSON.parse(rawBody) : null;

      if (!response.ok) {
        this.logger.error(
          `Anthropic API failed with status ${response.status}`,
          requestId ? `request-id=${requestId}` : undefined,
        );

        throw new HttpException(
          {
            message: 'Anthropic API request failed.',
            provider: 'anthropic',
            statusCode: response.status,
            requestId,
            details: parsedBody,
          },
          response.status as HttpStatus,
        );
      }

      return parsedBody as AnthropicMessageResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException(
          `Anthropic API request timed out after ${timeoutMs}ms.`,
        );
      }

      throw new ServiceUnavailableException(
        'Unable to reach the Anthropic API endpoint.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildMessagesEndpoint(baseUrl: string): string {
    const normalized = baseUrl.replace(/\/+$/, '');
    return normalized.endsWith('/v1')
      ? `${normalized}/messages`
      : `${normalized}/v1/messages`;
  }

  private buildAuthHeaders(input: {
    apiKey: string;
    apiVersion: string;
    baseUrl: string;
  }): Record<string, string> {
    const normalizedBaseUrl = input.baseUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'anthropic-version': input.apiVersion,
    };

    if (normalizedBaseUrl === 'https://api.anthropic.com') {
      headers['x-api-key'] = input.apiKey;
      return headers;
    }

    headers.Authorization = `Bearer ${input.apiKey}`;
    return headers;
  }

  private buildSystemPrompt(
    contexts: RetrievalContext[],
  ): string {
    const lines = [
      'You are the paid AI assistant for a monetized blog platform.',
      'Answer in Vietnamese unless the user explicitly requests another language.',
      'Use the retrieved context when it is relevant to the user question.',
      'If the context is insufficient, say so clearly instead of inventing details.',
    ];

    if (contexts.length > 0) {
      lines.push('Retrieved context chunks:');
      for (const [index, context] of contexts.entries()) {
        lines.push(
          [
            `[${index + 1}] source=${context.source} score=${context.score}`,
            context.title ? `title=${context.title}` : null,
            context.postId ? `postId=${context.postId}` : null,
            context.documentId ? `documentId=${context.documentId}` : null,
            context.excerpt,
          ]
            .filter(Boolean)
            .join('\n'),
        );
      }
    }

    return lines.join('\n');
  }

  private buildUserPrompt(
    dto: AiQuestionDto,
    contexts: RetrievalContext[],
  ): string {
    const contextHints: string[] = [];

    if (dto.postId) {
      contextHints.push(`postId: ${dto.postId}`);
    }

    if (dto.authorId) {
      contextHints.push(`authorId: ${dto.authorId}`);
    }

    if (contexts.length === 0) {
      contextHints.push('No retrieved context was found.');
    }

    return [
      'User question:',
      dto.question,
      '',
      'Request context:',
      contextHints.join('\n'),
    ].join('\n');
  }

  private buildPostText(post: PostEntity): string {
    const contentPlain =
      post.contentPlain?.trim() || this.extractTextFromRichContent(post.content);

    return [post.title, post.excerpt, contentPlain]
      .filter((value): value is string => Boolean(value?.trim()))
      .join('\n\n');
  }

  private extractTextFromRichContent(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.extractTextFromRichContent(item)).join(' ');
    }

    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>)
        .map((item) => this.extractTextFromRichContent(item))
        .join(' ');
    }

    return '';
  }

  private extractTextContent(
    content: AnthropicMessageResponse['content'],
  ): string {
    return content
      .filter((block): block is { type: 'text'; text: string } =>
        block.type === 'text' && 'text' in block,
      )
      .map((block) => block.text.trim())
      .filter(Boolean)
      .join('\n\n');
  }
}
