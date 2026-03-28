import { Coins, FileText, HelpCircle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateThisMonthRevenue } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Transaction, WalletEarnings } from "@/types/wallet.types";

interface StatsCardsProps {
  earnings?: WalletEarnings;
  transactions?: Transaction[];
  pendingQuestionCount: number;
  publishedPostCount: number;
  isLoading?: boolean;
}

export function StatsCards({
  earnings,
  transactions = [],
  pendingQuestionCount,
  publishedPostCount,
  isLoading = false,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Thu nhập tháng này",
      value: formatCurrency(calculateThisMonthRevenue(transactions)),
      icon: TrendingUp,
      iconClassName:
        "bg-[color-mix(in_oklab,rgb(16,185,129)_18%,transparent)] text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Tổng thu nhập",
      value: formatCurrency(earnings?.totalEarned ?? 0),
      icon: Coins,
      iconClassName:
        "bg-[color-mix(in_oklab,var(--color-primary)_18%,transparent)] text-primary",
    },
    {
      label: "Câu hỏi chờ trả lời",
      value: pendingQuestionCount.toString(),
      icon: HelpCircle,
      iconClassName:
        "bg-[color-mix(in_oklab,rgb(245,158,11)_18%,transparent)] text-amber-700 dark:text-amber-300",
    },
    {
      label: "Bài đã xuất bản",
      value: publishedPostCount.toString(),
      icon: FileText,
      iconClassName:
        "bg-[color-mix(in_oklab,rgb(14,165,233)_18%,transparent)] text-sky-700 dark:text-sky-300",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                {isLoading ? (
                  <Skeleton className="mt-3 h-8 w-36" />
                ) : (
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                )}
              </div>

              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl",
                  stat.iconClassName,
                )}
              >
                <stat.icon className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
