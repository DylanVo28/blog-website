import { Transform } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  normalizeOptionalString,
  parseJsonObjectField,
  parseStringArrayField,
} from './post-body-transform.util';

export class UpdatePostDto {
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  @MaxLength(600)
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => parseJsonObjectField(value))
  @IsObject()
  content?: Record<string, unknown>;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  contentPlain?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => parseStringArrayField(value))
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
