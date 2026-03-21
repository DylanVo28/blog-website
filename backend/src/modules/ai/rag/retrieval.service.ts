import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../../posts/entities/post.entity';
import { AuthorDocumentEntity } from '../entities/author-document.entity';
import { ChunkingService } from './chunking.service';

interface RetrievalInput {
  postId?: string;
  authorId?: string;
  question: string;
}

export interface RetrievalContext extends Record<string, unknown> {
  source: string;
  score: number;
  excerpt: string;
  postId?: string;
  documentId?: string;
  title?: string;
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly chunkingService: ChunkingService,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(AuthorDocumentEntity)
    private readonly authorDocumentsRepository: Repository<AuthorDocumentEntity>,
  ) {}

  async searchRelevantContext(input: RetrievalInput): Promise<RetrievalContext[]> {
    const questionTerms = this.tokenize(input.question);
    const contexts: RetrievalContext[] = [];

    if (input.postId) {
      const post = await this.postsRepository.findOne({
        where: {
          id: input.postId,
        },
      });

      if (post) {
        const postText = this.buildPostText(post);
        contexts.push(
          ...this.createContextsFromText({
            text: postText,
            questionTerms,
            source: 'posts',
            postId: post.id,
            title: post.title,
            includeLeadingChunksFallback: true,
          }),
        );
      }
    }

    if (input.authorId) {
      const documentQuery = this.authorDocumentsRepository
        .createQueryBuilder('document')
        .where('document.author_id = :authorId', {
          authorId: input.authorId,
        })
        .orderBy('document.created_at', 'DESC')
        .take(5);

      if (input.postId) {
        documentQuery.andWhere(
          '(document.post_id = :postId OR document.post_id IS NULL)',
          {
            postId: input.postId,
          },
        );
      }

      const documents = await documentQuery.getMany();

      for (const document of documents) {
        contexts.push(
          ...this.createContextsFromText({
            text: document.contentPlain ?? '',
            questionTerms,
            source: 'author_documents',
            postId: document.postId ?? undefined,
            documentId: document.id,
            title: document.fileName ?? 'Author document',
            includeLeadingChunksFallback: false,
          }),
        );
      }
    }

    return contexts
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
      .map((context) => ({
        ...context,
        excerpt: context.excerpt.slice(0, 1200),
      }));
  }

  private buildPostText(post: PostEntity): string {
    const contentPlain =
      post.contentPlain?.trim() || this.extractTextFromRichContent(post.content);

    return [post.title, post.excerpt, contentPlain]
      .filter((value): value is string => Boolean(value?.trim()))
      .join('\n\n');
  }

  private createContextsFromText(input: {
    text: string;
    questionTerms: string[];
    source: string;
    postId?: string;
    documentId?: string;
    title?: string;
    includeLeadingChunksFallback: boolean;
  }): RetrievalContext[] {
    if (!input.text.trim()) {
      return [];
    }

    const chunks = this.chunkingService.chunk(input.text, 700);
    const scoredChunks = chunks.map((chunk, index) => ({
      chunk,
      index,
      score: this.computeRelevance(input.questionTerms, chunk),
    }));

    const matchedChunks = scoredChunks
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, 3);

    const selectedChunks =
      matchedChunks.length > 0
        ? matchedChunks
        : input.includeLeadingChunksFallback
          ? scoredChunks.slice(0, 2).map((item, index) => ({
              ...item,
              score: 0.35 - index * 0.05,
            }))
          : [];

    return selectedChunks.map((item) => ({
      source: input.source,
      score: Number(item.score.toFixed(3)),
      excerpt:
        item.index === 0 && input.title
          ? `${input.title}\n\n${item.chunk}`
          : item.chunk,
      postId: input.postId,
      documentId: input.documentId,
      title: input.title,
    }));
  }

  private computeRelevance(questionTerms: string[], text: string): number {
    if (questionTerms.length === 0) {
      return 0;
    }

    const textTerms = new Set(this.tokenize(text));
    const overlapCount = questionTerms.filter((term) => textTerms.has(term)).length;

    if (overlapCount === 0) {
      return 0;
    }

    return overlapCount / questionTerms.length;
  }

  private tokenize(value: string): string[] {
    const normalized = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, ' ')
      .replace(/[^a-z0-9\s]/g, ' ');

    const stopWords = new Set([
      'va',
      'la',
      'cho',
      'toi',
      'them',
      'nay',
      've',
      'giai',
      'thich',
      'bai',
      'viet',
      'cua',
      'mot',
      'cac',
      'nhung',
    ]);

    return normalized
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length > 1 && !stopWords.has(term));
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
}
