import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { sanitizeUserText } from '../../../common/utils/sanitize-user-text.util';

export class AnswerQuestionDto {
  @Transform(({ value }) => sanitizeUserText(value))
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(10000)
  answer!: string;
}
