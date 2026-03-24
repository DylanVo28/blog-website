export type SocialProvider = "google" | "github";
export type AuthProvider = "local" | SocialProvider;
export type UserRole = "reader" | "author" | "admin";

export interface AuthorInfo {
  id: string;
  username?: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface UserProfile extends AuthorInfo {
  email: string;
  role: UserRole;
  isVerified: boolean;
  emailVerifiedAt?: string | null;
  authProvider?: AuthProvider;
  isPasswordSet?: boolean;
  isBanned?: boolean;
  bannedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
