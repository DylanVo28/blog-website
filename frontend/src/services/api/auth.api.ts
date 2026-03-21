import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api.types";
import type {
  AuthSession,
  ForgotPasswordPayload,
  ForgotPasswordResult,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyResetPasswordPayload,
  VerifyResetPasswordResult,
} from "@/types/auth.types";
import type { UserProfile } from "@/types/user.types";

interface LogoutResult {
  success: boolean;
  message: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<AuthSession>>("/auth/login", payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<AuthSession>>("/auth/register", {
      email: payload.email,
      password: payload.password,
      displayName: payload.displayName,
    }),

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
