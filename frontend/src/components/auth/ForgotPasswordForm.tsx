"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useCountdown } from "@/hooks/useCountdown";
import { authApi } from "@/services/api/auth.api";
import type { ForgotPasswordPayload, ForgotPasswordResult } from "@/types/auth.types";

export function ForgotPasswordForm() {
  const { isRunning, seconds, start } = useCountdown(60);
  const [result, setResult] = useState<ForgotPasswordResult | null>(null);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<ForgotPasswordPayload>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      const response = await authApi.forgotPassword(payload);
      return response.data.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setSentEmail(form.getValues("email"));
      start();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể tạo yêu cầu đặt lại mật khẩu."));
    },
  });

  return (
    <div className="space-y-5">
      {result ? (
        <div className="space-y-5">
          <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-950">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Yêu cầu khôi phục đã được ghi nhận</p>
                <p className="text-sm leading-6 text-emerald-900/80">
                  Nếu tài khoản tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu đến{" "}
                  <span className="font-semibold">{sentEmail}</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-muted/35 p-4">
            <p className="text-sm font-semibold text-foreground">Bạn sẽ nhận được gì?</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li>Link đặt lại mật khẩu chỉ dùng được một lần.</li>
              <li>Mã OTP đi kèm nếu mailer được cấu hình ở backend.</li>
              <li>Token khôi phục có hiệu lực trong thời gian ngắn để giảm rủi ro.</li>
            </ul>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={mutation.isPending || isRunning}
            onClick={() => mutation.mutate({ email: sentEmail })}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang gửi lại...
              </>
            ) : isRunning ? (
              `Gửi lại sau ${seconds}s`
            ) : (
              "Gửi lại email khôi phục"
            )}
          </Button>
        </div>
      ) : (
        <>
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
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang gửi hướng dẫn...
                </>
              ) : (
                "Gửi yêu cầu khôi phục"
              )}
            </Button>
          </form>

          <div className="rounded-[1.4rem] border border-dashed border-border/80 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Khi chạy local mà chưa cấu hình email service, backend sẽ trả kèm token và
            reset URL để mình test toàn bộ flow ngay trên frontend.
          </div>
        </>
      )}
    </div>
  );
}
