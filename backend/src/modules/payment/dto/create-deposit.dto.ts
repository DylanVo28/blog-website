import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PAYMENT_METHODS } from '../../../common/constants';

export class CreateDepositDto {
  @IsInt()
  @Min(10000, { message: 'Số tiền tối thiểu là 10.000đ.' })
  amount!: number;

  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  paymentMethod?: (typeof PAYMENT_METHODS)[number];
}
