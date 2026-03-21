import { AppRole } from '../../../common/constants';

export class UserResponseDto {
  id!: string;
  email!: string;
  displayName!: string;
  avatarUrl!: string | null;
  bio!: string | null;
  role!: AppRole;
  isVerified!: boolean;
  createdAt!: Date;
}
