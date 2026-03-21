import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class WithdrawDto {
  @IsInt()
  @Min(100000)
  amount!: number;

  @IsString()
  @MaxLength(100)
  bankName!: string;

  @IsString()
  @MaxLength(50)
  bankAccount!: string;

  @IsString()
  @MaxLength(100)
  bankHolder!: string;
}
