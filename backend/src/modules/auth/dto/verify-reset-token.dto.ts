import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class VerifyResetTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Token không được để trống.' })
  token!: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'OTP phải đúng 6 chữ số.' })
  otpCode?: string;
}
