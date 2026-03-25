export type SocialProvider = "google" | "github";
export type AuthProvider = "local" | SocialProvider;
export type UserRole = "reader" | "author" | "admin";

export interface UserBankInfo {
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
}

export interface AuthorInfo {
  id: string;
  username?: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface UserProfile extends AuthorInfo, UserBankInfo {
  email: string;
  role: UserRole;
  isVerified: boolean;
  emailVerifiedAt?: string | null;
  authProvider?: AuthProvider;
  isPasswordSet?: boolean;
  isBanned?: boolean;
  bannedAt?: string | null;
  banReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileStats {
  userId: string;
  postsCount: number;
  questionsCount: number;
  earnings: number;
}

export interface UpdateProfilePayload extends UserBankInfo {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
}
