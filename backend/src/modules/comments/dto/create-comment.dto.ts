import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
