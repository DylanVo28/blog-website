"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useWalletStore } from "@/stores/walletStore";
import { cn } from "@/lib/utils";

interface WalletBadgeProps {
  balance?: number;
  className?: string;
}

export function WalletBadge({ balance: balanceProp, className }: WalletBadgeProps) {
  const balance = useWalletStore((state) => state.balance);
  const isLoading = useWalletStore((state) => state.isLoading);
  const displayBalance = balanceProp ?? balance;

  return (
    <Link
      href="/wallet"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100",
        className,
      )}
    >
      <Wallet className="size-4" />
      <span>{isLoading ? "Đang tải..." : formatCurrency(displayBalance)}</span>
    </Link>
  );
}
