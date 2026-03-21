import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { sanitizeUserText } from '../../../common/utils/sanitize-user-text.util';

export class CreateCommentDto {
  @Transform(({ value }) => sanitizeUserText(value))
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
