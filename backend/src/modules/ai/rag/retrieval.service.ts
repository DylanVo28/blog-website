import { Injectable } from '@nestjs/common';

@Injectable()
export class RetrievalService {
  searchRelevantContext(input: {
    postId?: string;
    authorId?: string;
    question: string;
  }) {
    return [
      {
        source: input.postId ? 'post_embeddings' : 'author_documents',
        score: 0.92,
        excerpt: `Context scaffold for question: ${input.question.slice(0, 60)}`,
      },
    ];
  }
}
