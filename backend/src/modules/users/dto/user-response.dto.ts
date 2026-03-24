import { AppRole } from '../../../common/constants';
import type { AuthProvider } from '../../auth/types/social-auth.types';

export class UserResponseDto {
  id!: string;
  email!: string;
  username!: string | null;
  displayName!: string;
  avatarUrl!: string | null;
  bio!: string | null;
  role!: AppRole;
  isVerified!: boolean;
  emailVerifiedAt!: Date;
  authProvider!: AuthProvider;
  isPasswordSet!: boolean;
  isBanned!: boolean;
  bannedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
