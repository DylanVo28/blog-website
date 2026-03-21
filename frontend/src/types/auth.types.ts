import type { UserProfile } from "@/types/user.types";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: UserProfile;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  username?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResult {
  success: boolean;
  message: string;
  resetToken?: string;
  resetUrl?: string;
  otpCode?: string;
  expiresAt?: string;
}

export interface VerifyResetPasswordPayload {
  token: string;
  otpCode?: string;
}

export interface VerifyResetPasswordResult {
  success: boolean;
  valid: boolean;
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
