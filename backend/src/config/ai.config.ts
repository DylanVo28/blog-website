import { registerAs } from '@nestjs/config';

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const aiConfig = registerAs('ai', () => ({
  provider: process.env.AI_PROVIDER ?? 'anthropic',
  model:
    process.env.ANTHROPIC_MODEL ??
    process.env.AI_MODEL ??
    'claude-opus-4.6',
  embeddingModel:
    process.env.AI_EMBEDDING_MODEL ?? 'text-embedding-004',
  embeddingDimensions: Number(process.env.AI_EMBEDDING_DIMENSIONS ?? 768),
  apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.AI_API_KEY ?? '',
  baseUrl: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com',
  apiVersion: process.env.ANTHROPIC_API_VERSION ?? '2023-06-01',
  maxTokens: toNumber(process.env.AI_MAX_TOKENS, 1024),
  temperature: toNumber(process.env.AI_TEMPERATURE, 0.2),
  timeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 30000),
}));
