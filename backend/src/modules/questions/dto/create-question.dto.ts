import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { QUESTION_TARGETS } from '../../../common/constants';
import { sanitizeUserText } from '../../../common/utils/sanitize-user-text.util';

export class CreateQuestionDto {
  @Transform(({ value }) => sanitizeUserText(value))
  @IsNotEmpty()
  @IsString()
  @MinLength(10, {
    message: 'Cau hoi phai co it nhat 10 ky tu.',
  })
  @MaxLength(2000)
  content!: string;

  @IsIn(QUESTION_TARGETS)
  target!: (typeof QUESTION_TARGETS)[number];

  @IsOptional()
  @IsInt()
  @Min(1000)
  fee?: number;
}
