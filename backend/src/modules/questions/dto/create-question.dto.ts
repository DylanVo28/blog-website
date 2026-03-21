import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { QUESTION_TARGETS } from '../../../common/constants';

export class CreateQuestionDto {
  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsIn(QUESTION_TARGETS)
  target!: (typeof QUESTION_TARGETS)[number];

  @IsOptional()
  @IsInt()
  @Min(1000)
  fee?: number;
}
