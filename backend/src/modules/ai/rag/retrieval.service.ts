import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PostEntity } from '../../posts/entities/post.entity';
import { AuthorDocumentEntity } from '../entities/author-document.entity';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';

interface RetrievalInput {
  postId?: string;
  authorId?: string;
  question: string;
  topK?: number;
  vector?: number[];
}

export interface RetrievalContext extends Record<string, unknown> {
  source: string;
  score: number;
  excerpt: string;
  postId?: string;
  documentId?: string;
  title?: string;
  chunkIndex?: number;
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(AuthorDocumentEntity)
    private readonly authorDocumentsRepository: Repository<AuthorDocumentEntity>,
  ) {}

  async searchRelevantContext(input: RetrievalInput): Promise<RetrievalContext[]> {
    const topK = input.topK ?? 5;
    const questionVector =
      input.vector ?? (await this.embeddingService.embed(input.question)).vector;
    const vectorContexts = await this.search({
      vector: questionVector,
      postId: input.postId,
      authorId: input.authorId,
      topK,
    });

    if (vectorContexts.length >= topK) {
      return vectorContexts;
    }

    const fallbackContexts = await this.searchFallbackContext(input);

    return this.mergeContexts(vectorContexts, fallbackContexts, topK);
  }

  async search(params: {
    vector: number[];
    postId?: string;
    authorId?: string;
    topK: number;
  }): Promise<RetrievalContext[]> {
    if (!params.postId && !params.authorId) {
      return [];
    }

    const vectorLiteral = this.embeddingService.toVectorLiteral(params.vector);
    const rows = await this.dataSource.query(
      `
        SELECT *
        FROM (
          (
            SELECT
              'post' AS source,
              pe.chunk_text AS "chunkText",
              pe.chunk_index AS "chunkIndex",
              pe.post_id AS "postId",
              NULL::uuid AS "documentId",
              COALESCE(pe.metadata ->> 'title', 'Post chunk') AS title,
              1 - (pe.embedding <=> $1::vector) AS similarity
            FROM post_embeddings pe
            WHERE $2::uuid IS NOT NULL
              AND pe.post_id = $2::uuid
          )
          UNION ALL
          (
            SELECT
              'document' AS source,
              de.chunk_text AS "chunkText",
              de.chunk_index AS "chunkIndex",
              ad.post_id AS "postId",
              de.document_id AS "documentId",
              COALESCE(ad.file_name, 'Author document') AS title,
              1 - (de.embedding <=> $1::vector) AS similarity
            FROM document_embeddings de
            INNER JOIN author_documents ad ON ad.id = de.document_id
            WHERE $3::uuid IS NOT NULL
              AND de.author_id = $3::uuid
              AND ($2::uuid IS NULL OR ad.post_id = $2::uuid OR ad.post_id IS NULL)
          )
        ) ranked
        ORDER BY similarity DESC NULLS LAST
        LIMIT $4
      `,
      [vectorLiteral, params.postId ?? null, params.authorId ?? null, params.topK],
    );

    return rows.map(
      (row: {
        source: string;
        chunkText: string;
        chunkIndex: number | string | null;
        postId: string | null;
        documentId: string | null;
        title: string | null;
        similarity: number | string | null;
      }) => ({
        source: row.source,
        score: Number(Number(row.similarity ?? 0).toFixed(3)),
        excerpt: row.chunkText.slice(0, 1200),
        postId: row.postId ?? undefined,
        documentId: row.documentId ?? undefined,
        title: row.title ?? undefined,
        chunkIndex:
          row.chunkIndex === null ? undefined : Number(row.chunkIndex),
      }),
    );
  }

  private async searchFallbackContext(
    input: RetrievalInput,
  ): Promise<RetrievalContext[]> {
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
            source: 'post',
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
            source: 'document',
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
      .slice(0, input.topK ?? 5)
      .map((context) => ({
        ...context,
        excerpt: context.excerpt.slice(0, 1200),
      }));
  }

  private mergeContexts(
    primary: RetrievalContext[],
    fallback: RetrievalContext[],
    topK: number,
  ): RetrievalContext[] {
    const merged: RetrievalContext[] = [];
    const seen = new Set<string>();

    for (const context of [...primary, ...fallback]) {
      const key = [
        context.source,
        context.postId ?? '',
        context.documentId ?? '',
        context.chunkIndex ?? '',
        context.excerpt,
      ].join(':');

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      merged.push(context);

      if (merged.length >= topK) {
        break;
      }
    }

    return merged;
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
      chunkIndex: item.index,
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
