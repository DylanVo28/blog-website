import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingProcessor {
  private readonly logger = new Logger(EmbeddingProcessor.name);

  async processPostEmbeddings(postId: string) {
    this.logger.log(`Embedding processor scaffolded for post ${postId}.`);
    return {
      postId,
      processed: false,
    };
  }
}
