export const APP_NAME = "Inkline";
export const APP_DESCRIPTION =
  "Blog platform frontend foundation cho hệ thống bài viết, comment miễn phí và câu hỏi trả phí.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3000";

export const QUESTION_FEE = 1_000;
export const REFUND_WINDOW_HOURS = 48;

export const AUTH_COOKIE_KEY = "auth-token";
export const AUTH_ROLE_COOKIE_KEY = "auth-role";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/wallet",
  "/notifications",
  "/posts/new",
  "/profile/settings",
];

export const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
export const ADMIN_ROUTES = ["/admin"];

export const DEFAULT_QUERY_STALE_TIME = 60 * 1000;
