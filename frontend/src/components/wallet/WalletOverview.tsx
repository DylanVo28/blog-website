import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { BalanceDisplay } from "@/components/wallet/BalanceDisplay";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Wallet } from "@/types/wallet.types";

interface WalletOverviewProps {
  wallet?: Wallet;
  isLoading?: boolean;
}

export function WalletOverview({ wallet, isLoading = false }: WalletOverviewProps) {
  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-[2rem]" />;
  }

  return (
    <Card className="overflow-hidden border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_28%,transparent),transparent_42%),radial-gradient(circle_at_bottom_right,color-mix(in_oklab,var(--color-accent)_22%,transparent),transparent_48%),linear-gradient(135deg,color-mix(in_oklab,var(--color-card)_58%,var(--color-primary)_42%),color-mix(in_oklab,var(--color-card)_34%,var(--color-primary)_66%)_48%,color-mix(in_oklab,var(--color-card)_24%,var(--color-accent)_76%))] p-6 text-foreground shadow-[0_28px_90px_-50px_rgba(25,32,56,0.38)]">
      <div className="flex items-start justify-between gap-4">
        <BalanceDisplay balance={wallet?.balance ?? 0} />
        <div className="rounded-full border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_72%,transparent)] p-3 text-primary shadow-sm">
          <WalletIcon className="size-5" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.4rem] border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_76%,transparent)] p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-foreground/76">
            <ArrowDownLeft className="size-4" />
            <span className="text-sm font-medium">Tổng thu</span>
          </div>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(wallet?.totalEarned ?? 0)}</p>
        </div>

        <div className="rounded-[1.4rem] border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_76%,transparent)] p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-foreground/76">
            <ArrowUpRight className="size-4" />
            <span className="text-sm font-medium">Tổng chi</span>
          </div>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(wallet?.totalSpent ?? 0)}</p>
        </div>
      </div>
    </Card>
  );
}
