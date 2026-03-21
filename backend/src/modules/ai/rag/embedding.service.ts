import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  generateEmbedding(_text: string) {
    return {
      dimensions: 768,
      provider: 'stub',
      vectorPreview: [0.01, 0.02, 0.03],
    };
  }
}
