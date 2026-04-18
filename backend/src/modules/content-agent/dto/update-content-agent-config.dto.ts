import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  normalizeOptionalString,
  parseStringArrayField,
} from '../../posts/dto/post-body-transform.util';
import { CONTENT_AGENT_PUBLISH_MODES } from '../content-agent.types';

function toOptionalBoolean(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }
  }

  return value;
}

function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function toNullableString(value: unknown) {
  if (value === null) {
    return null;
  }

  const normalized = normalizeOptionalString(value);
  return normalized === undefined ? null : normalized;
}

export class UpdateContentAgentConfigDto {
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(0)
  @Max(23)
  scheduleHour?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(0)
  @Max(59)
  scheduleMinute?: number;

  @IsOptional()
  @Transform(({ value }) => parseStringArrayField(value))
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  @IsOptional()
  @Transform(({ value }) => parseStringArrayField(value))
  @IsArray()
  @IsUrl({}, { each: true })
  sourceAllowlist?: string[];

  @IsOptional()
  @IsIn(CONTENT_AGENT_PUBLISH_MODES)
  publishMode?: (typeof CONTENT_AGENT_PUBLISH_MODES)[number];

  @IsOptional()
  @Transform(({ value }) => toNullableString(value))
  @IsUUID()
  systemAuthorId?: string | null;

  @IsOptional()
  @Transform(({ value }) => toNullableString(value))
  @IsUUID()
  defaultCategoryId?: string | null;

  @IsOptional()
  @Transform(({ value }) => parseStringArrayField(value))
  @IsArray()
  @IsUUID('4', { each: true })
  defaultTagIds?: string[];

  @IsOptional()
  @Transform(({ value }) => toNullableString(value))
  @IsString()
  writingStyle?: string | null;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  @Max(168)
  maxArticleAgeHours?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  @Max(50)
  maxResearchItems?: number;
}
