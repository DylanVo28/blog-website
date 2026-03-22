"use client";

import { Landmark, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/wallet.types";

interface PaymentMethodSelectProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export function PaymentMethodSelect({
  value,
  onChange,
}: PaymentMethodSelectProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <button
        type="button"
        onClick={() => onChange("vnpay")}
        className={cn(
          "rounded-[1.4rem] border-2 p-4 text-left transition-all",
          value === "vnpay"
            ? "border-sky-300 bg-sky-50 shadow-sm"
            : "border-border/70 bg-white/80 hover:border-sky-200",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "rounded-full p-2",
              value === "vnpay" ? "bg-sky-100 text-sky-700" : "bg-muted text-muted-foreground",
            )}
          >
            <Landmark className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">VNPay</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Thanh toán qua thẻ ATM, QR hoặc thẻ quốc tế.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChange("momo")}
        className={cn(
          "rounded-[1.4rem] border-2 p-4 text-left transition-all",
          value === "momo"
            ? "border-fuchsia-300 bg-fuchsia-50 shadow-sm"
            : "border-border/70 bg-white/80 hover:border-fuchsia-200",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "rounded-full p-2",
              value === "momo"
                ? "bg-fuchsia-100 text-fuchsia-700"
                : "bg-muted text-muted-foreground",
            )}
          >
            <WalletCards className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">MoMo</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Chuyển sang cổng thanh toán MoMo sandbox của backend.
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
