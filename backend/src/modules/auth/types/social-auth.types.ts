export const SUPPORTED_SOCIAL_PROVIDERS = ['google', 'github'] as const;

export type SocialProvider = (typeof SUPPORTED_SOCIAL_PROVIDERS)[number];
export type AuthProvider = 'local' | SocialProvider;

export interface SocialProfile {
  provider: SocialProvider;
  providerId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  rawProfile: Record<string, unknown>;
}
