import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email!: string;

  @IsNotEmpty({ message: 'Mã OTP không được để trống.' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 chữ số.' })
  @Matches(/^\d{6}$/, { message: 'Mã OTP chỉ được chứa chữ số.' })
  otp!: string;
}
