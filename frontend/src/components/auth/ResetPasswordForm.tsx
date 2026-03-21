"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validators";
import { authApi } from "@/services/api/auth.api";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useWalletStore } from "@/stores/walletStore";
import type { ResetPasswordPayload } from "@/types/auth.types";

const checklist = [
  {
    label: "Ít nhất 8 ký tự",
    test: (password: string) => password.length >= 8,
  },
  {
    label: "Có chữ hoa",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: "Có chữ thường",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    label: "Có số",
    test: (password: string) => /\d/.test(password),
  },
  {
    label: "Có ký tự đặc biệt",
    test: (password: string) => /[@$!%*?&]/.test(password),
  },
];

function getPasswordStrength(password: string) {
  if (!password) {
    return {
      colorClassName: "bg-border",
      label: "Chưa nhập",
      score: 0,
      textClassName: "text-muted-foreground",
    };
  }

  let score = 0;

  if (password.length >= 8) {
    score += 20;
  }

  if (password.length >= 12) {
    score += 10;
  }

  if (/[a-z]/.test(password)) {
    score += 15;
  }

  if (/[A-Z]/.test(password)) {
    score += 15;
  }

  if (/\d/.test(password)) {
    score += 20;
  }

  if (/[@$!%*?&]/.test(password)) {
    score += 20;
  }

  if (score < 40) {
    return {
      colorClassName: "bg-destructive",
      label: "Yếu",
      score,
      textClassName: "text-destructive",
    };
  }

  if (score < 70) {
    return {
      colorClassName: "bg-amber-500",
      label: "Trung bình",
      score,
      textClassName: "text-amber-600",
    };
  }

  if (score < 90) {
    return {
      colorClassName: "bg-emerald-500",
      label: "Mạnh",
      score,
      textClassName: "text-emerald-600",
    };
  }

  return {
    colorClassName: "bg-emerald-600",
    label: "Rất mạnh",
    score: 100,
    textClassName: "text-emerald-700",
  };
}

function PasswordRule({ label, met }: { label: string; met: boolean }) {
  const Icon = met ? CheckCircle2 : XCircle;

  return (
    <li className="flex items-center gap-2 text-sm">
      <Icon className={met ? "size-4 text-emerald-600" : "size-4 text-muted-foreground"} />
      <span className={met ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function ResetPasswordErrorState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <AuthShell
      badge="Khôi phục"
      title={title}
      description={description}
      helperTitle="Link reset cần còn hiệu lực"
      helperDescription="Vì token chỉ dùng được một lần và có hạn sử dụng ngắn, trường hợp lỗi thường chỉ cần yêu cầu một link mới."
      footer={
        <p>
          Muốn thử lại từ đầu?{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Gửi link khôi phục mới
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-[1.5rem] border border-border/70 bg-muted/40 p-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/80 text-primary">
            {icon}
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild>
            <Link href="/forgot-password">Yêu cầu link mới</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">
              <ArrowLeft className="mr-2 size-4" />
              Quay lại đăng nhập
            </Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logout = useAuthStore((state) => state.logout);
  const resetWallet = useWalletStore((state) => state.reset);
  const resetNotifications = useNotificationStore((state) => state.reset);
  const token = searchParams.get("token")?.trim() ?? "";

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  const form = useForm<ResetPasswordPayload>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const password = useWatch({
    control: form.control,
    name: "newPassword",
  }) ?? "";
  const strength = getPasswordStrength(password);

  const verifyQuery = useQuery({
    queryKey: ["auth", "verify-reset-token", token],
    queryFn: async () => {
      const response = await authApi.verifyResetToken({ token });
      return response.data.data;
    },
    enabled: token.length > 0,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const resetMutation = useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      const response = await authApi.resetPassword(payload);
      return response.data.data;
    },
    onSuccess: (result) => {
      logout();
      resetWallet();
      resetNotifications();
      setResetCompleted(true);
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể đặt lại mật khẩu."));
    },
  });

  const verifiedEmail = verifyQuery.data?.email ?? "tài khoản của bạn";

  if (!token) {
    return (
      <ResetPasswordErrorState
        icon={<AlertTriangle className="size-5" />}
        title="Thiếu token khôi phục"
        description="Link bạn mở không chứa token hợp lệ. Hãy kiểm tra lại email hoặc yêu cầu gửi link mới."
      />
    );
  }

  if (verifyQuery.isLoading) {
    return (
      <AuthShell
        badge="Khôi phục"
        title="Đang xác thực link đặt lại mật khẩu."
        description="Mình đang kiểm tra token này còn hiệu lực hay không trước khi cho phép đổi mật khẩu."
        helperTitle="Xác thực trước khi hiển thị form"
        helperDescription="Bước verify sớm giúp mình chặn link hết hạn hoặc đã dùng ngay từ đầu, thay vì để người dùng nhập lại mật khẩu rồi mới báo lỗi."
        footer={
          <p>
            Không muốn chờ?{" "}
            <Link
              href="/forgot-password"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Yêu cầu link khác
            </Link>
          </p>
        }
      >
        <div className="rounded-[1.6rem] border border-border/70 bg-muted/35 px-5 py-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span>Đang xác thực token khôi phục...</span>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (verifyQuery.isError) {
    return (
      <ResetPasswordErrorState
        icon={<XCircle className="size-5" />}
        title="Link khôi phục không còn dùng được"
        description={getApiErrorMessage(
          verifyQuery.error,
          "Token không hợp lệ hoặc đã hết hạn.",
        )}
      />
    );
  }

  if (resetCompleted) {
    return (
      <AuthShell
        badge="Hoàn tất"
        title="Mật khẩu mới đã được lưu thành công."
        description="Phiên đăng nhập cũ không còn hiệu lực nữa. Bạn có thể đăng nhập lại ngay với mật khẩu vừa cập nhật."
        helperTitle="Reset xong là đăng nhập lại"
        helperDescription="Backend đã đánh dấu thời điểm đổi mật khẩu để token cũ không còn hợp lệ, nên trải nghiệm sau reset sẽ sạch và an toàn hơn."
        footer={
          <p>
            Sẵn sàng quay lại?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Đăng nhập với mật khẩu mới
            </button>
          </p>
        }
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white">
              <ShieldCheck className="size-6 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Đặt lại mật khẩu thành công</p>
              <p className="text-sm leading-6 text-emerald-800/80">
                Tài khoản của bạn đã sẵn sàng. Hãy đăng nhập lại để tiếp tục sử dụng hệ thống.
              </p>
            </div>
          </div>

          <Button className="w-full" onClick={() => router.push("/login")}>
            Đi đến trang đăng nhập
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badge="Đặt lại mật khẩu"
      title="Tạo một mật khẩu mới an toàn hơn cho tài khoản của bạn."
      description={`Token này đang hợp lệ cho ${verifiedEmail}. Sau khi lưu mật khẩu mới, bạn sẽ cần đăng nhập lại.`}
      helperTitle="Flow reset đã nối API thật"
      helperDescription="Trang này verify token trước, kiểm tra độ mạnh của mật khẩu trên client và submit về backend với contract mới."
      footer={
        <p>
          Muốn quay lại?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Trở về đăng nhập
          </Link>
        </p>
      }
    >
      <form
        onSubmit={form.handleSubmit((values) =>
          resetMutation.mutate({
            ...values,
            token,
          }),
        )}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="reset-password">
            Mật khẩu mới
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
              className="pr-12 pl-11"
              {...form.register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.newPassword ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.newPassword.message}
            </p>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-foreground">Độ mạnh mật khẩu</span>
            <span className={strength.textClassName}>{strength.label}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border/70">
            <div
              className={`h-full rounded-full transition-all ${strength.colorClassName}`}
              style={{ width: `${strength.score}%` }}
            />
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {checklist.map((rule) => (
              <PasswordRule
                key={rule.label}
                label={rule.label}
                met={rule.test(password)}
              />
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="reset-confirm-password">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="reset-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              className="pr-12 pl-11"
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.confirmPassword ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={resetMutation.isPending || !form.formState.isValid}
        >
          {resetMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang cập nhật mật khẩu...
            </>
          ) : (
            "Lưu mật khẩu mới"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
