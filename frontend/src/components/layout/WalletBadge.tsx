"use client";

import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useWalletStore } from "@/stores/walletStore";

export function WalletBadge() {
  const balance = useWalletStore((state) => state.balance);

  return (
    <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-white/70 px-3 py-2 text-sm font-medium text-foreground shadow-sm md:flex">
      <Wallet className="size-4 text-primary" />
      <span>{formatCurrency(balance)}</span>
    </div>
  );
}
