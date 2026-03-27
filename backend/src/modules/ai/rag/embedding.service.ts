import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_DEFAULTS } from '../../../common/constants';

export interface EmbeddingResult {
  provider: string;
  model: string;
  dimensions: number;
  vector: number[];
  vectorLiteral: string;
  vectorPreview: number[];
}

@Injectable()
export class EmbeddingService {
  constructor(private readonly configService: ConfigService) {}

  async embed(text: string): Promise<EmbeddingResult> {
    const dimensions =
      this.configService.get<number>('ai.embeddingDimensions') ??
      AI_DEFAULTS.embeddingDimensions;
    const normalized = this.normalizeText(text);
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const features = this.buildFeatures(tokens);
    const vector = new Array(dimensions).fill(0);

    for (const feature of features) {
      const primaryBucket = this.hashFeature(feature) % dimensions;
      const secondaryBucket =
        this.hashFeature(`${feature}:secondary`) % dimensions;
      const sign = this.hashFeature(`${feature}:sign`) % 2 === 0 ? 1 : -1;
      const weight = feature.includes('__') ? 1.35 : 1;

      vector[primaryBucket] += weight * sign;
      vector[secondaryBucket] += weight * 0.5 * sign;
    }

    const normalizedVector = this.normalizeVector(vector);

    return {
      provider: 'deterministic-local',
      model:
        this.configService.get<string>('ai.embeddingModel') ??
        AI_DEFAULTS.embeddingModel,
      dimensions,
      vector: normalizedVector,
      vectorLiteral: this.toVectorLiteral(normalizedVector),
      vectorPreview: normalizedVector
        .slice(0, 8)
        .map((value) => Number(value.toFixed(6))),
    };
  }

  async embedMany(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map((text) => this.embed(text)));
  }

  toVectorLiteral(vector: number[]): string {
    return `[${vector.map((value) => Number(value.toFixed(8))).join(',')}]`;
  }

  private buildFeatures(tokens: string[]): string[] {
    if (tokens.length === 0) {
      return ['__empty__'];
    }

    const features = [...tokens];

    for (let index = 0; index < tokens.length - 1; index += 1) {
      features.push(`${tokens[index]}__${tokens[index + 1]}`);
    }

    return features;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, value) => sum + value * value, 0),
    );

    if (magnitude === 0) {
      return vector;
    }

    return vector.map((value) => value / magnitude);
  }

  private hashFeature(feature: string): number {
    let hash = 2166136261;

    for (let index = 0; index < feature.length; index += 1) {
      hash ^= feature.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }
}
