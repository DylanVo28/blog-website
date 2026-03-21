import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  AUTH_COOKIE_KEY,
  AUTH_COOKIE_MAX_AGE,
  AUTH_ROLE_COOKIE_KEY,
} from "@/lib/constants";
import type { AuthSession, AuthTokens } from "@/types/auth.types";
import type { UserProfile, UserRole } from "@/types/user.types";

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function syncAuthCookies(token: string | null, role: UserRole | null) {
  if (token) {
    setCookie(AUTH_COOKIE_KEY, token, AUTH_COOKIE_MAX_AGE);
  } else {
    clearCookie(AUTH_COOKIE_KEY);
  }

  if (role) {
    setCookie(AUTH_ROLE_COOKIE_KEY, role, AUTH_COOKIE_MAX_AGE);
  } else {
    clearCookie(AUTH_ROLE_COOKIE_KEY);
  }
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  setTokens: (tokens: Partial<AuthTokens>) => void;
  login: (session: AuthSession) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setUser: (user) => {
        syncAuthCookies(get().accessToken, user?.role ?? null);
        set({
          user,
          isAuthenticated: Boolean(user && get().accessToken),
        });
      },
      setTokens: ({ accessToken, refreshToken }) => {
        const nextAccessToken = accessToken ?? get().accessToken;
        const nextRefreshToken = refreshToken ?? get().refreshToken;

        syncAuthCookies(nextAccessToken, get().user?.role ?? null);

        set({
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
          isAuthenticated: Boolean(nextAccessToken && get().user),
        });
      },
      login: ({ user, accessToken, refreshToken }) => {
        syncAuthCookies(accessToken, user.role);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },
      logout: () => {
        syncAuthCookies(null, null);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : window.localStorage,
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        syncAuthCookies(state?.accessToken ?? null, state?.user?.role ?? null);
      },
    },
  ),
);
