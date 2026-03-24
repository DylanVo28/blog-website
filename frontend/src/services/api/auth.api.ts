import apiClient from "@/services/api/client";
import { API_URL } from "@/lib/constants";
import type { ApiResponse } from "@/types/api.types";
import type {
  AuthSession,
  ForgotPasswordPayload,
  ForgotPasswordResult,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  SendVerificationPayload,
  SendVerificationResult,
  VerifyEmailPayload,
  VerifyEmailResult,
  VerifyResetPasswordPayload,
  VerifyResetPasswordResult,
} from "@/types/auth.types";
import type { SocialProvider } from "@/types/user.types";
import type { UserProfile } from "@/types/user.types";

interface LogoutResult {
  success: boolean;
  message: string;
}

export const authApi = {
  getSocialLoginUrl: (provider: SocialProvider, redirect?: string) => {
    const url = new URL(
      `${API_URL.replace(/\/$/, "")}/auth/${provider}`,
    );

    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      url.searchParams.set("redirect", redirect);
    }

    return url.toString();
  },

  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<AuthSession>>("/auth/login", payload),

  sendVerification: (payload: SendVerificationPayload) =>
    apiClient.post<ApiResponse<SendVerificationResult>>(
      "/auth/send-verification",
      payload,
    ),

  verifyEmail: (payload: VerifyEmailPayload) =>
    apiClient.post<ApiResponse<VerifyEmailResult>>("/auth/verify-email", payload),

  resendOtp: (payload: SendVerificationPayload) =>
    apiClient.post<ApiResponse<SendVerificationResult>>("/auth/resend-otp", payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<AuthSession>>("/auth/register", payload),

  logout: () =>
    apiClient.post<ApiResponse<LogoutResult>>("/auth/logout"),

  getMe: () =>
    apiClient.get<ApiResponse<UserProfile>>("/users/me"),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post<ApiResponse<ForgotPasswordResult>>("/auth/password/forgot", payload),

  verifyResetToken: (payload: VerifyResetPasswordPayload) =>
    apiClient.post<ApiResponse<VerifyResetPasswordResult>>(
      "/auth/password/verify-token",
      payload,
    ),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<ApiResponse<LogoutResult>>("/auth/password/reset", payload),
};
