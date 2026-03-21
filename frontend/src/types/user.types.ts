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
  isBanned?: boolean;
  bannedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
