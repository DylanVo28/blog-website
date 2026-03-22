import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminReviewDepositDto {
  @IsBoolean()
  approved!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
