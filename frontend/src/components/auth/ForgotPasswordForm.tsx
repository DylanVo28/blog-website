"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/formatters";
import { emailSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { authApi } from "@/services/api/auth.api";
import type { ForgotPasswordResult } from "@/types/auth.types";

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [result, setResult] = useState<ForgotPasswordResult | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ email }: ForgotPasswordValues) => {
      const response = await authApi.forgotPassword(email);
      return response.data.data;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể tạo yêu cầu đặt lại mật khẩu."));
    },
  });

  return (
    <div className="space-y-5">
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="forgot-email">
            Email tài khoản
          </label>
          <Input
            id="forgot-email"
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

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang tạo reset token..." : "Gửi yêu cầu khôi phục"}
        </Button>
      </form>

      <div className="rounded-[1.4rem] border border-dashed border-border/80 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
        Khi chạy local, backend hiện trả về reset token trong response để tiện test thủ
        công mà chưa cần email service.
      </div>

      {result?.resetToken ? (
        <div className="rounded-[1.6rem] border border-primary/20 bg-primary/6 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Reset Token Dev
          </p>
          <p className="mt-3 break-all font-mono text-sm text-foreground">
            {result.resetToken}
          </p>
          {result.expiresAt ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Hết hạn lúc {formatDateTime(result.expiresAt)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
