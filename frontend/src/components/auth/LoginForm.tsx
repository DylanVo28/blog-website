"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Github } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { authApi } from "@/services/api/auth.api";
import { walletApi } from "@/services/api/wallet.api";
import { useAuthStore } from "@/stores/authStore";
import { useWalletStore } from "@/stores/walletStore";
import type { LoginPayload } from "@/types/auth.types";
import type { SocialProvider } from "@/types/user.types";

function getSafeRedirect(redirect: string | null) {
  return redirect && redirect.startsWith("/") && !redirect.startsWith("//")
    ? redirect
    : "/";
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.8 12.23c0-.68-.06-1.34-.18-1.97H12v3.73h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.4Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.08-.92 6.77-2.48l-3.3-2.56c-.92.62-2.08 1-3.47 1-2.67 0-4.93-1.8-5.73-4.22H2.86v2.64A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.27 13.74A6.02 6.02 0 0 1 5.95 12c0-.6.11-1.18.32-1.74V7.62H2.86A10 10 0 0 0 2 12c0 1.61.39 3.13 1.09 4.38l3.18-2.64Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.96c1.5 0 2.84.52 3.9 1.54l2.92-2.92C17.07 2.95 14.75 2 12 2a10 10 0 0 0-9.14 5.62l3.41 2.64c.8-2.42 3.06-4.3 5.73-4.3Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const setBalance = useWalletStore((state) => state.setBalance);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(
    null,
  );

  const form = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await authApi.login(payload);
      return response.data.data;
    },
    onMutate: () => {
      form.clearErrors("root");
    },
    onSuccess: async (session) => {
      login(session);

      try {
        const wallet = await walletApi.getWallet();
        setBalance(wallet.balance);
      } catch {
        setBalance(0);
      }

      toast.success("Đăng nhập thành công.");
      const redirect = getSafeRedirect(searchParams.get("redirect"));
      startTransition(() => {
        router.replace(redirect);
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "Đăng nhập thất bại.");

      form.setError("root", {
        type: "server",
        message,
      });
      toast.error(message);
    },
  });

  const callbackError = searchParams.get("error");
  const callbackDetail = searchParams.get("detail");

  useEffect(() => {
    if (!callbackError) {
      return;
    }

    const message =
      callbackDetail?.trim() || "Đăng nhập mạng xã hội thất bại. Vui lòng thử lại.";

    form.setError("root", {
      type: "server",
      message,
    });
    toast.error(message);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("error");
    nextParams.delete("detail");

    startTransition(() => {
      const query = nextParams.toString();
      router.replace(query ? `/login?${query}` : "/login");
    });
  }, [callbackDetail, callbackError, form, router, searchParams]);

  function handleSocialLogin(provider: SocialProvider) {
    setLoadingProvider(provider);
    const redirect = getSafeRedirect(searchParams.get("redirect"));
    window.location.assign(authApi.getSocialLoginUrl(provider, redirect));
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-4"
    >
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between rounded-[1.2rem] border-border/80 bg-card/80"
          disabled={mutation.isPending || Boolean(loadingProvider)}
          onClick={() => handleSocialLogin("google")}
        >
          <span className="flex items-center gap-2">
            <GoogleIcon />
            Tiếp tục với Google
          </span>
          {loadingProvider === "google" ? "Đang mở..." : "OAuth"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-between rounded-[1.2rem] border-border/80 bg-card/80"
          disabled={mutation.isPending || Boolean(loadingProvider)}
          onClick={() => handleSocialLogin("github")}
        >
          <span className="flex items-center gap-2">
            <Github className="size-4" />
            Tiếp tục với GitHub
          </span>
          {loadingProvider === "github" ? "Đang mở..." : "OAuth"}
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        <span className="h-px flex-1 bg-border/80" />
        <span>Dùng email</span>
        <span className="h-px flex-1 bg-border/80" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="login-email">
          Email
        </label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-foreground" htmlFor="login-password">
            Mật khẩu
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      {form.formState.errors.root?.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {form.formState.errors.root.message}
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending || Boolean(loadingProvider)}
      >
        {mutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
