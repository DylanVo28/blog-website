"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getApiErrorMessage } from "@/lib/api";
import { passwordSchema, registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { authApi } from "@/services/api/auth.api";
import { walletApi } from "@/services/api/wallet.api";
import { useAuthStore } from "@/stores/authStore";
import { useWalletStore } from "@/stores/walletStore";
import type { RegisterPayload } from "@/types/auth.types";

const registerFormSchema = registerSchema
  .extend({
    confirmPassword: passwordSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Mật khẩu xác nhận chưa khớp.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.input<typeof registerFormSchema>;

export function RegisterForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const setBalance = useWalletStore((state) => state.setBalance);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      return response.data.data;
    },
    onSuccess: async (session) => {
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
      toast.error(getApiErrorMessage(error, "Đăng ký thất bại."));
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(
        (values) =>
          mutation.mutate({
            displayName: values.displayName,
            email: values.email,
            password: values.password,
            username: values.username,
          }),
        () => {
          toast.error("Vui lòng kiểm tra lại thông tin đăng ký.");
        },
      )}
      className="space-y-4"
    >
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
          {...form.register("displayName")}
        />
        {form.formState.errors.displayName ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.displayName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="register-email">
          Email
        </label>
        <Input
          id="register-email"
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

      <div className="rounded-[1.4rem] border border-dashed border-border/80 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
        Backend hiện mới hỗ trợ đăng ký bằng email, mật khẩu và display name. Username
        public sẽ được bật khi backend có field tương ứng.
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="register-password">
          Mật khẩu
        </label>
        <Input
          id="register-password"
          type="password"
          placeholder="Ít nhất 8 ký tự"
          autoComplete="new-password"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
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
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </Button>
    </form>
  );
}
