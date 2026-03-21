import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token không được để trống.' })
  token!: string;

  @Transform(({ value, obj }) => value ?? obj.password)
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự.' })
  @MaxLength(50, { message: 'Mật khẩu tối đa 50 ký tự.' })
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.',
  })
  newPassword!: string;

  @Transform(({ value, obj }) => value ?? obj.password)
  @IsString()
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống.' })
  confirmPassword!: string;
}
