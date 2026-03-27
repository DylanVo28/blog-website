import { registerAs } from '@nestjs/config';
import { AI_DEFAULTS } from '../common/constants';

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const aiConfig = registerAs('ai', () => ({
  provider: process.env.AI_PROVIDER ?? AI_DEFAULTS.provider,
  model:
    process.env.ANTHROPIC_MODEL ??
    process.env.AI_MODEL ??
    AI_DEFAULTS.model,
  embeddingModel:
    process.env.AI_EMBEDDING_MODEL ?? AI_DEFAULTS.embeddingModel,
  embeddingDimensions: Number(
    process.env.AI_EMBEDDING_DIMENSIONS ?? AI_DEFAULTS.embeddingDimensions,
  ),
  apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.AI_API_KEY ?? '',
  baseUrl: process.env.ANTHROPIC_BASE_URL ?? AI_DEFAULTS.baseUrl,
  apiVersion: process.env.ANTHROPIC_API_VERSION ?? AI_DEFAULTS.apiVersion,
  maxTokens: toNumber(process.env.AI_MAX_TOKENS, AI_DEFAULTS.maxTokens),
  temperature: toNumber(process.env.AI_TEMPERATURE, AI_DEFAULTS.temperature),
  timeoutMs: toNumber(process.env.AI_TIMEOUT_MS, AI_DEFAULTS.timeoutMs),
}));
