"use client";

import { useMutation } from "@tanstack/react-query";
import { Coins, ExternalLink } from "lucide-react";
import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { PaymentMethodSelect } from "@/components/wallet/PaymentMethodSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { walletApi } from "@/services/api/wallet.api";
import type { PaymentMethod } from "@/types/wallet.types";

const MIN_DEPOSIT_AMOUNT = 10_000;
const PRESET_AMOUNTS = [10_000, 50_000, 100_000, 200_000, 500_000, 1_000_000];

export function DepositForm() {
  const [amount, setAmount] = useState(MIN_DEPOSIT_AMOUNT);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay");

  const depositMutation = useMutation({
    mutationFn: () =>
      walletApi.createDeposit({
        amount,
        paymentMethod,
      }),
    onSuccess: (order) => {
      toast.success("Đã tạo lệnh nạp tiền. Đang chuyển tới cổng thanh toán...");
      window.location.assign(order.paymentRequest.paymentUrl);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể tạo lệnh nạp tiền."));
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#12445f,#0b7b90_52%,#68b3ba)] text-white">
        <CardHeader>
          <div className="inline-flex size-12 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <Coins className="size-5" />
          </div>
          <CardTitle className="mt-4 text-white">Nạp tiền vào ví Inkline</CardTitle>
          <CardDescription className="text-white/78">
            Chọn số tiền nạp và phương thức thanh toán để lấy link redirect từ backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/78">
            Tối thiểu theo backend hiện tại là {formatCurrency(MIN_DEPOSIT_AMOUNT)}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Số tiền nạp</CardTitle>
          <CardDescription>
            Mỗi {formatCurrency(1_000)} tương ứng một câu hỏi premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {PRESET_AMOUNTS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={amount === preset ? "default" : "outline"}
                className="justify-center"
                onClick={() => setAmount(preset)}
              >
                {formatCurrency(preset)}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="deposit-amount">
              Hoặc nhập số tiền khác
            </label>
            <Input
              id="deposit-amount"
              type="number"
              min={MIN_DEPOSIT_AMOUNT}
              step={10_000}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value || 0))}
            />
            <p className="text-xs text-muted-foreground">
              Backend sẽ từ chối số tiền nhỏ hơn {formatCurrency(MIN_DEPOSIT_AMOUNT)}.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Phương thức thanh toán</CardTitle>
          <CardDescription>
            Chọn kênh thanh toán bạn muốn dùng cho lệnh nạp hiện tại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethodSelect value={paymentMethod} onChange={setPaymentMethod} />
        </CardContent>
      </Card>

      <div className="rounded-[1.6rem] border border-border/70 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Xác nhận</p>
            <p className="mt-2 font-serif text-3xl font-medium tracking-tight">
              {formatCurrency(amount)}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Khi callback thanh toán thành công từ backend, số dư ví mới được cộng thật.
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            disabled={depositMutation.isPending}
            onClick={() => {
              if (amount < MIN_DEPOSIT_AMOUNT) {
                toast.error(`Số tiền nạp tối thiểu là ${formatCurrency(MIN_DEPOSIT_AMOUNT)}.`);
                return;
              }

              void depositMutation.mutateAsync();
            }}
          >
            <ExternalLink className="size-4" />
            {depositMutation.isPending ? "Đang tạo lệnh..." : "Tiếp tục thanh toán"}
          </Button>
        </div>
      </div>
    </div>
  );
}
