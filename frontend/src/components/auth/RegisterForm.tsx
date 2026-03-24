"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getApiErrorMessage, isUnauthorizedError } from "@/lib/api";
import {
  emailVerificationSchema,
  otpVerificationSchema,
  registerSchema,
} from "@/lib/validators";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { authApi } from "@/services/api/auth.api";
import { walletApi } from "@/services/api/wallet.api";
import { useAuthStore } from "@/stores/authStore";
import { useWalletStore } from "@/stores/walletStore";
import type {
  AuthSession,
  RegisterPayload,
  SendVerificationPayload,
  SendVerificationResult,
  VerifyEmailPayload,
  VerifyEmailResult,
} from "@/types/auth.types";

const registerAccountSchema = registerSchema
  .extend({
    confirmPassword: z.string().trim().min(1, "Vui lòng nhập lại mật khẩu."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Mật khẩu xác nhận chưa khớp.",
    path: ["confirmPassword"],
  });

const REGISTER_STEPS = [
  { id: "email", label: "Email" },
  { id: "otp", label: "OTP" },
  { id: "register", label: "Hồ sơ" },
] as const;

type RegisterStep = (typeof REGISTER_STEPS)[number]["id"];
type EmailFormValues = z.input<typeof emailVerificationSchema>;
type OtpFormValues = z.input<typeof otpVerificationSchema>;
type RegisterAccountFormValues = z.input<typeof registerAccountSchema>;

function getStepIndex(step: RegisterStep) {
  return REGISTER_STEPS.findIndex((item) => item.id === step);
}

export function RegisterForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const setBalance = useWalletStore((state) => state.setBalance);

  const [currentStep, setCurrentStep] = useState<RegisterStep>("email");
  const [email, setEmail] = useState("");
  const [otpExpiresInMinutes, setOtpExpiresInMinutes] = useState<number | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [verificationWindowMinutes, setVerificationWindowMinutes] = useState<number | null>(
    null,
  );
  const [cooldownSeed, setCooldownSeed] = useState(0);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: "",
    },
  });

  const accountForm = useForm<RegisterAccountFormValues>({
    resolver: zodResolver(registerAccountSchema),
    defaultValues: {
      displayName: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    seconds: resendCountdown,
    start: startCountdown,
    stop: stopCountdown,
  } = useCountdown(cooldownSeed);

  useEffect(() => {
    emailForm.setValue("email", email);
  }, [email, emailForm]);

  useEffect(() => {
    if (cooldownSeed <= 0) {
      stopCountdown();
      return;
    }

    stopCountdown();
    startCountdown();
  }, [cooldownSeed, startCountdown, stopCountdown]);

  const sendVerificationMutation = useMutation({
    mutationFn: async (payload: SendVerificationPayload) => {
      const response = await authApi.sendVerification(payload);
      return response.data.data;
    },
    onSuccess: (result: SendVerificationResult) => {
      setEmail(result.email);
      setOtpExpiresInMinutes(Math.ceil(result.expires_in / 60));
      setVerificationToken(null);
      setVerificationWindowMinutes(null);
      setCooldownSeed(result.retry_after);
      setCurrentStep("otp");
      otpForm.reset({ otp: "" });
      toast.success("Mã OTP đã được gửi tới email của bạn.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể gửi mã OTP."));
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (payload: VerifyEmailPayload) => {
      const response = await authApi.verifyEmail(payload);
      return response.data.data;
    },
    onSuccess: (result: VerifyEmailResult) => {
      setVerificationToken(result.verification_token);
      setVerificationWindowMinutes(Math.ceil(result.token_expires_in / 60));
      setCurrentStep("register");
      toast.success("Email đã được xác thực. Hoàn tất thông tin để tạo tài khoản.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Xác thực OTP thất bại."));
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async (payload: SendVerificationPayload) => {
      const response = await authApi.resendOtp(payload);
      return response.data.data;
    },
    onSuccess: (result: SendVerificationResult) => {
      setOtpExpiresInMinutes(Math.ceil(result.expires_in / 60));
      setCooldownSeed(result.retry_after);
      otpForm.reset({ otp: "" });
      toast.success("Mã OTP mới đã được gửi.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Chưa thể gửi lại OTP."));
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      return response.data.data;
    },
    onSuccess: async (session: AuthSession) => {
      login(session);

      try {
        const wallet = await walletApi.getWallet();
        setBalance(wallet.balance);
      } catch {
        setBalance(0);
      }

      toast.success("Tạo tài khoản thành công.");
      startTransition(() => {
        router.replace("/");
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        handleVerificationExpired();
        return;
      }

      toast.error(getApiErrorMessage(error, "Đăng ký thất bại."));
    },
  });

  const currentIndex = getStepIndex(currentStep);
  const otpStepError = verifyEmailMutation.error ?? resendOtpMutation.error;

  function handleGoBack() {
    if (currentStep === "otp") {
      setCurrentStep("email");
      return;
    }

    if (currentStep === "register") {
      setCurrentStep("otp");
    }
  }

  function handleVerificationExpired() {
    setCurrentStep("email");
    setVerificationToken(null);
    setVerificationWindowMinutes(null);
    toast.error("Phiên xác thực đã hết hạn. Vui lòng xác thực email lại từ đầu.");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {REGISTER_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div
              key={step.id}
              className={`rounded-[1.2rem] border px-3 py-3 text-center transition ${
                isCompleted
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : isActive
                    ? "border-foreground/15 bg-card text-foreground"
                    : "border-border bg-muted/40 text-muted-foreground"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.24em]">
                {isCompleted ? "Done" : `Bước ${index + 1}`}
              </div>
              <div className="mt-1 text-sm font-medium">{step.label}</div>
            </div>
          );
        })}
      </div>

      {currentStep === "email" ? (
        <form
          onSubmit={emailForm.handleSubmit(
            (values) =>
              sendVerificationMutation.mutate({
                email: values.email.trim().toLowerCase(),
              }),
            () => {
              toast.error("Vui lòng kiểm tra lại email.");
            },
          )}
          className="space-y-4"
        >
          <div className="rounded-[1.4rem] border border-dashed border-border/80 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Chúng tôi chỉ tạo tài khoản sau khi email đã được xác thực thành công bằng OTP.
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="register-email">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="pl-10"
                disabled={sendVerificationMutation.isPending}
                {...emailForm.register("email")}
              />
            </div>
            {emailForm.formState.errors.email ? (
              <p className="text-sm text-destructive">
                {emailForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          {sendVerificationMutation.error ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(sendVerificationMutation.error)}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={sendVerificationMutation.isPending}>
            {sendVerificationMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi OTP...
              </>
            ) : (
              <>
                Tiếp tục
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      ) : null}

      {currentStep === "otp" ? (
        <form
          onSubmit={otpForm.handleSubmit(
            (values) =>
              verifyEmailMutation.mutate({
                email,
                otp: values.otp.trim(),
              }),
            () => {
              toast.error("Vui lòng nhập đúng mã OTP gồm 6 chữ số.");
            },
          )}
          className="space-y-4"
        >
          <div className="rounded-[1.4rem] border border-border/80 bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
            <div className="font-medium text-foreground">{email}</div>
            <div>
              Nhập mã OTP vừa được gửi qua email.
              {otpExpiresInMinutes !== null && otpExpiresInMinutes > 0
                ? ` Mã hiện tại có hiệu lực khoảng ${otpExpiresInMinutes} phút.`
                : ""}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="register-otp">
              Mã OTP
            </label>
            <Input
              id="register-otp"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
              autoComplete="one-time-code"
              className="text-center font-mono text-lg tracking-[0.45em]"
              disabled={verifyEmailMutation.isPending}
              {...otpForm.register("otp")}
            />
            {otpForm.formState.errors.otp ? (
              <p className="text-sm text-destructive">
                {otpForm.formState.errors.otp.message}
              </p>
            ) : null}
          </div>

          {otpStepError ? (
            <p className="text-sm text-destructive">{getApiErrorMessage(otpStepError)}</p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Đổi email
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={resendCountdown > 0 || resendOtpMutation.isPending}
              onClick={() => resendOtpMutation.mutate({ email })}
            >
              {resendOtpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : resendCountdown > 0 ? (
                `Gửi lại sau ${resendCountdown}s`
              ) : (
                "Gửi lại OTP"
              )}
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={verifyEmailMutation.isPending}>
            {verifyEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              <>
                Xác nhận email
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      ) : null}

      {currentStep === "register" ? (
        <form
          onSubmit={accountForm.handleSubmit(
            (values) => {
              if (!verificationToken) {
                handleVerificationExpired();
                return;
              }

              registerMutation.mutate({
                verification_token: verificationToken,
                displayName: values.displayName.trim(),
                username: values.username.trim().toLowerCase(),
                password: values.password,
              });
            },
            () => {
              toast.error("Vui lòng kiểm tra lại thông tin đăng ký.");
            },
          )}
          className="space-y-4"
        >
          <div className="rounded-[1.4rem] border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-6">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {email}
            </div>
            <div className="mt-1 text-muted-foreground">
              Email đã được xác thực.
              {verificationWindowMinutes !== null && verificationWindowMinutes > 0
                ? ` Verification token có hiệu lực khoảng ${verificationWindowMinutes} phút.`
                : ""}
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-foreground"
              htmlFor="register-display-name"
            >
              Tên hiển thị
            </label>
            <Input
              id="register-display-name"
              placeholder="Nguyen Van A"
              autoComplete="name"
              disabled={registerMutation.isPending}
              {...accountForm.register("displayName")}
            />
            {accountForm.formState.errors.displayName ? (
              <p className="text-sm text-destructive">
                {accountForm.formState.errors.displayName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="register-username">
              Username
            </label>
            <Input
              id="register-username"
              placeholder="nguyenvana"
              autoComplete="username"
              disabled={registerMutation.isPending}
              {...accountForm.register("username")}
            />
            <p className="text-xs text-muted-foreground">
              Username sẽ được lưu dạng chữ thường và dùng cho hồ sơ công khai sau này.
            </p>
            {accountForm.formState.errors.username ? (
              <p className="text-sm text-destructive">
                {accountForm.formState.errors.username.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="register-password">
              Mật khẩu
            </label>
            <Input
              id="register-password"
              type="password"
              placeholder="Ít nhất 8 ký tự, có chữ hoa, số và ký tự đặc biệt"
              autoComplete="new-password"
              disabled={registerMutation.isPending}
              {...accountForm.register("password")}
            />
            {accountForm.formState.errors.password ? (
              <p className="text-sm text-destructive">
                {accountForm.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-foreground"
              htmlFor="register-confirm-password"
            >
              Xác nhận mật khẩu
            </label>
            <Input
              id="register-confirm-password"
              type="password"
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              disabled={registerMutation.isPending}
              {...accountForm.register("confirmPassword")}
            />
            {accountForm.formState.errors.confirmPassword ? (
              <p className="text-sm text-destructive">
                {accountForm.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {registerMutation.error ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(registerMutation.error)}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại OTP
            </Button>

            <Button type="submit" className="min-w-44" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  Tạo tài khoản
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
