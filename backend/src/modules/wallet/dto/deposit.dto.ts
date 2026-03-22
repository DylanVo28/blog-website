import { IsIn, IsInt, Min } from 'class-validator';
import { PAYMENT_METHODS } from '../../../common/constants';

export class DepositDto {
  @IsInt()
  @Min(10000)
  amount!: number;

  @IsIn(PAYMENT_METHODS)
  paymentMethod!: (typeof PAYMENT_METHODS)[number];
}
