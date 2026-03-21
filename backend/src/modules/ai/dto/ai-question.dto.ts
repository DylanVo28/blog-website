import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AiQuestionDto {
  @IsString()
  @MaxLength(5000)
  question!: string;

  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;
}
