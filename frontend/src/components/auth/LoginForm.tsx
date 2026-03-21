"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";
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

function getSafeRedirect(redirect: string | null) {
  return redirect && redirect.startsWith("/") ? redirect : "/";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const setBalance = useWalletStore((state) => state.setBalance);

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
    onSuccess: async (session) => {
      login(session);

      try {
        const walletResponse = await walletApi.getWallet();
        setBalance(walletResponse.data.data.balance);
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
      toast.error(getApiErrorMessage(error, "Đăng nhập thất bại."));
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-4"
    >
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

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
