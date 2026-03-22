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
    <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,rgba(255,243,213,0.38),transparent_42%),linear-gradient(135deg,#a54a12,#db7d1f_48%,#f1a93e)] p-6 text-white shadow-[0_28px_90px_-50px_rgba(154,72,11,0.8)]">
      <div className="flex items-start justify-between gap-4">
        <BalanceDisplay balance={wallet?.balance ?? 0} />
        <div className="rounded-full border border-white/20 bg-white/10 p-3 text-white/90">
          <WalletIcon className="size-5" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-white/80">
            <ArrowDownLeft className="size-4" />
            <span className="text-sm font-medium">Tổng thu</span>
          </div>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(wallet?.totalEarned ?? 0)}</p>
        </div>

        <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-white/80">
            <ArrowUpRight className="size-4" />
            <span className="text-sm font-medium">Tổng chi</span>
          </div>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(wallet?.totalSpent ?? 0)}</p>
        </div>
      </div>
    </Card>
  );
}
