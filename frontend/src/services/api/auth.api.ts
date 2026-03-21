import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api.types";
import type {
  AuthSession,
  ForgotPasswordResult,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
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

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<ForgotPasswordResult>>("/auth/forgot-password", {
      email,
    }),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<ApiResponse<LogoutResult>>("/auth/reset-password", payload),
};
