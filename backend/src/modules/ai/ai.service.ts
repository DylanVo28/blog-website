import { randomUUID } from 'node:crypto';
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
import { Repository } from 'typeorm';
import { AiQuestionDto } from './dto/ai-question.dto';
import { AuthorDocumentEntity } from './entities/author-document.entity';
import { ChunkingService } from './rag/chunking.service';
import { EmbeddingService } from './rag/embedding.service';
import { RetrievalService } from './rag/retrieval.service';

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
    private readonly configService: ConfigService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly retrievalService: RetrievalService,
    @InjectRepository(AuthorDocumentEntity)
    private readonly authorDocumentsRepository: Repository<AuthorDocumentEntity>,
  ) {}

  async ask(dto: AiQuestionDto) {
    const contexts = this.retrievalService.searchRelevantContext(dto);
    const anthropicResponse = await this.createAnthropicMessage(dto, contexts);
    const answer = this.extractTextContent(anthropicResponse.content);

    return {
      provider: 'anthropic',
      model: anthropicResponse.model,
      answer,
      stopReason: anthropicResponse.stop_reason,
      usage: anthropicResponse.usage ?? null,
      contexts,
      embeddingPreview: this.embeddingService.generateEmbedding(dto.question),
    };
  }

  async uploadAuthorDocument(authorId: string, fileName: string, content = '') {
    const chunks = this.chunkingService.chunk(content);
    const document = await this.authorDocumentsRepository.save(
      this.authorDocumentsRepository.create({
        authorId,
        fileName,
        contentPlain: content || null,
        isProcessed: Boolean(content),
      }),
    );

    return {
      ...document,
      chunks,
      chunkCount: chunks.length,
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
    contexts: Array<Record<string, unknown>>,
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
    contexts: Array<Record<string, unknown>>,
  ): string {
    const lines = [
      'You are the paid AI assistant for a monetized blog platform.',
      'Answer in Vietnamese unless the user explicitly requests another language.',
      'Use the retrieved context when it is relevant to the user question.',
      'If the context is insufficient, say so clearly instead of inventing details.',
    ];

    if (contexts.length > 0) {
      lines.push('Retrieved context summary:');
      for (const [index, context] of contexts.entries()) {
        lines.push(`${index + 1}. ${JSON.stringify(context)}`);
      }
    }

    return lines.join('\n');
  }

  private buildUserPrompt(
    dto: AiQuestionDto,
    contexts: Array<Record<string, unknown>>,
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
