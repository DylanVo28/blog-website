import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class PaymentCallbackDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  paymentRef?: string;

  @IsOptional()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
