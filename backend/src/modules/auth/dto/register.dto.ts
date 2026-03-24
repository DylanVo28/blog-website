import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Thiếu verification token.' })
  verification_token!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @MaxLength(128, { message: 'Mật khẩu không được vượt quá 128 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]+$/, {
    message:
      'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.',
  })
  password!: string;

  @IsString()
  @MinLength(2, { message: 'Tên hiển thị phải có ít nhất 2 ký tự.' })
  @MaxLength(100, { message: 'Tên hiển thị không được vượt quá 100 ký tự.' })
  @Transform(({ value }) => value?.trim())
  displayName!: string;

  @IsString()
  @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự.' })
  @MaxLength(30, { message: 'Username không được vượt quá 30 ký tự.' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username chỉ được chứa chữ, số, dấu gạch ngang hoặc gạch dưới.',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username!: string;
}
