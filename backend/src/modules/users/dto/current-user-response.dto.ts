import { UserResponseDto } from './user-response.dto';

export class CurrentUserResponseDto extends UserResponseDto {
  bankName!: string | null;
  bankAccount!: string | null;
  bankHolder!: string | null;
}
