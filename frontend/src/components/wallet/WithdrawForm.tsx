"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { InsufficientBalance } from "@/components/wallet/InsufficientBalance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { walletApi } from "@/services/api/wallet.api";

const withdrawSchema = z.object({
  amount: z.coerce.number().int().min(100_000, "Số tiền rút tối thiểu là 100.000đ."),
  bankName: z.string().trim().min(2, "Nhập tên ngân hàng.").max(100),
  bankAccount: z.string().trim().min(6, "Nhập số tài khoản hợp lệ.").max(50),
  bankHolder: z.string().trim().min(2, "Nhập tên chủ tài khoản.").max(100),
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;
type WithdrawFormInput = z.input<typeof withdrawSchema>;

export function WithdrawForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const walletQuery = useQuery({
    queryKey: ["wallet", "overview"],
    queryFn: () => walletApi.getWallet(),
  });

  const form = useForm<WithdrawFormInput, undefined, WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: 100_000,
      bankName: "",
      bankAccount: "",
      bankHolder: "",
    },
  });
  const rawAmount = useWatch({
    control: form.control,
    name: "amount",
  });

  const withdrawMutation = useMutation({
    mutationFn: (values: WithdrawFormValues) => walletApi.requestWithdraw(values),
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu rút tiền. Lệnh đang chờ admin duyệt.");
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      startTransition(() => {
        router.push("/wallet");
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể tạo yêu cầu rút tiền."));
    },
  });

  const currentBalance = walletQuery.data?.balance ?? 0;
  const amount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount ?? 0);

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="paper-grid">
          <CardHeader>
            <CardTitle className="text-3xl">Rút tiền về tài khoản ngân hàng</CardTitle>
            <CardDescription>
              Yêu cầu rút tiền hiện tạo trạng thái `pending` trên backend và sẽ được admin duyệt sau.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Số dư hiện tại: <span className="font-semibold text-foreground">{formatCurrency(currentBalance)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Mức tối thiểu cho mỗi lần rút là {formatCurrency(100_000)}.
            </p>
          </CardContent>
        </Card>

        <form
          onSubmit={form.handleSubmit((values) => {
            if (currentBalance < values.amount) {
              setShowInsufficientBalance(true);
              return;
            }

            void withdrawMutation.mutateAsync(values);
          })}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Thông tin rút tiền</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="withdraw-amount">
                  Số tiền
                </label>
                <Input id="withdraw-amount" type="number" min={100_000} step={10_000} {...form.register("amount")} />
                {form.formState.errors.amount ? (
                  <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="withdraw-bank-name">
                    Ngân hàng
                  </label>
                  <Input id="withdraw-bank-name" placeholder="Vietcombank" {...form.register("bankName")} />
                  {form.formState.errors.bankName ? (
                    <p className="text-sm text-destructive">{form.formState.errors.bankName.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="withdraw-bank-account">
                    Số tài khoản
                  </label>
                  <Input id="withdraw-bank-account" placeholder="0123456789" {...form.register("bankAccount")} />
                  {form.formState.errors.bankAccount ? (
                    <p className="text-sm text-destructive">{form.formState.errors.bankAccount.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="withdraw-bank-holder">
                  Chủ tài khoản
                </label>
                <Input id="withdraw-bank-holder" placeholder="NGUYEN VAN A" {...form.register("bankHolder")} />
                {form.formState.errors.bankHolder ? (
                  <p className="text-sm text-destructive">{form.formState.errors.bankHolder.message}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild type="button" variant="outline">
              <Link href="/wallet">Quay lại ví</Link>
            </Button>
            <Button type="submit" size="lg" disabled={withdrawMutation.isPending || walletQuery.isLoading}>
              {withdrawMutation.isPending ? "Đang gửi yêu cầu..." : "Tạo yêu cầu rút tiền"}
            </Button>
          </div>
        </form>
      </div>

      <InsufficientBalance
        open={showInsufficientBalance}
        onClose={() => {
          setShowInsufficientBalance(false);
          form.setValue("amount", Math.max(100_000, Math.min(currentBalance, amount || 100_000)), {
            shouldValidate: true,
          });
        }}
        requiredAmount={amount || 0}
        currentBalance={currentBalance}
      />
    </>
  );
}
