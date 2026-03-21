import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkingService {
  chunk(text: string, chunkSize = 500): string[] {
    if (!text.trim()) {
      return [];
    }

    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];

    for (const word of words) {
      currentChunk.push(word);

      if (currentChunk.join(' ').length >= chunkSize) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }
}
