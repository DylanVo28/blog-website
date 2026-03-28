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
      aria-busy={isLoading}
      className={cn(
        "surface-panel inline-flex items-center gap-2 rounded-full border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_58%),linear-gradient(135deg,color-mix(in_oklab,var(--color-card)_84%,var(--color-accent)_16%),color-mix(in_oklab,var(--color-card)_72%,var(--color-primary)_28%))] px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-primary)_16%,transparent)] text-primary">
        <Wallet className="size-4" />
      </span>
      <span className={cn("transition-colors", isLoading ? "text-muted-foreground" : "text-foreground")}>
        {isLoading ? "Đang tải..." : formatCurrency(displayBalance)}
      </span>
    </Link>
  );
}
