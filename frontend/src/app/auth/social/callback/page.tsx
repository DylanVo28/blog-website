"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getApiErrorMessage } from "@/lib/api";
import { authApi } from "@/services/api/auth.api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/components/ui/toast";

function getSafeRedirect(redirect: string | null) {
  return redirect && redirect.startsWith("/") && !redirect.startsWith("//")
    ? redirect
    : "/";
}

export default function SocialCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [statusMessage, setStatusMessage] = useState(
    "Đang xác thực phiên đăng nhập mạng xã hội...",
  );

  useEffect(() => {
    let cancelled = false;

    async function finishSocialLogin() {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const redirect = getSafeRedirect(searchParams.get("redirect"));

      if (!accessToken || !refreshToken) {
        const params = new URLSearchParams({
          error: "social_auth_failed",
          detail: "Thiếu token từ social login callback.",
          redirect,
        });

        startTransition(() => {
          router.replace(`/login?${params.toString()}`);
        });
        return;
      }

      try {
        setTokens({
          accessToken,
          refreshToken,
        });
        setStatusMessage("Đang đồng bộ hồ sơ người dùng...");

        const response = await authApi.getMe();

        if (cancelled) {
          return;
        }

        setUser(response.data.data);
        toast.success("Đăng nhập mạng xã hội thành công.");

        startTransition(() => {
          router.replace(redirect);
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        logout();

        const message = getApiErrorMessage(
          error,
          "Không thể hoàn tất đăng nhập mạng xã hội.",
        );
        const params = new URLSearchParams({
          error: "social_auth_failed",
          detail: message,
          redirect,
        });

        toast.error(message);
        startTransition(() => {
          router.replace(`/login?${params.toString()}`);
        });
      }
    }

    void finishSocialLogin();

    return () => {
      cancelled = true;
    };
  }, [logout, router, searchParams, setTokens, setUser]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <Badge className="w-fit">Social Login</Badge>
          <CardTitle className="text-3xl md:text-4xl">
            Đang hoàn tất phiên đăng nhập.
          </CardTitle>
          <CardDescription>
            Ứng dụng đang xác thực token và nạp hồ sơ trước khi đưa bạn quay lại trang trước đó.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-10">
          <LoadingSpinner className="min-h-40 justify-center" label={statusMessage} />
        </CardContent>
      </Card>
    </div>
  );
}
