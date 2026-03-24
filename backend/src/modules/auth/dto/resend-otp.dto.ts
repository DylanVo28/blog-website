import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendOtpDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email!: string;
}
