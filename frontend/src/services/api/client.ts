import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";
import type { ApiResponse } from "@/types/api.types";
import type { ApiErrorResponse } from "@/types/api.types";
import type { AuthTokens } from "@/types/auth.types";

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const UNAUTHENTICATED_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/send-verification",
  "/auth/verify-email",
  "/auth/resend-otp",
  "/auth/password/forgot",
  "/auth/password/reset",
  "/auth/password/verify-token",
];

function buildApiUrl(pathname: string) {
  return `${API_URL.replace(/\/$/, "")}/${pathname.replace(/^\//, "")}`;
}

function isUnauthenticatedAuthRequest(url?: string) {
  return Boolean(url && UNAUTHENTICATED_AUTH_PATHS.some((path) => url.includes(path)));
}

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<AuthTokens> | null = null;

async function refreshAccessToken(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<AuthTokens>>(buildApiUrl("/auth/refresh"), {
        refreshToken,
      })
      .then((response) => response.data.data)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    const headers = AxiosHeaders.from(config.headers);
    headers.delete("Content-Type");
    config.headers = headers;
  }

  const token = useAuthStore.getState().accessToken;

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    const refreshToken = useAuthStore.getState().refreshToken;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");
    const shouldBypassUnauthorizedHandler =
      isRefreshRequest || isUnauthenticatedAuthRequest(originalRequest?.url);

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      shouldBypassUnauthorizedHandler
    ) {
      return Promise.reject(error);
    }

    if (!refreshToken) {
      useAuthStore.getState().logout();

      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const tokens = await refreshAccessToken(refreshToken);
      useAuthStore.getState().setTokens(tokens);

      const headers = AxiosHeaders.from(originalRequest.headers);
      headers.set("Authorization", `Bearer ${tokens.accessToken}`);
      originalRequest.headers = headers;

      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();

      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }

      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
