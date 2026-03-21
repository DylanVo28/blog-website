import { IsString, MaxLength } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  @MaxLength(10000)
  answer!: string;
}
