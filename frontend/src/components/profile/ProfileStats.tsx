import { Coins, FileText, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { UserProfileStats } from "@/types/user.types";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileStatsProps {
  stats: UserProfileStats;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const items = [
    {
      label: "Bài viết đã xuất bản",
      value: stats.postsCount.toString(),
      icon: FileText,
    },
    {
      label: "Câu hỏi đã gửi",
      value: stats.questionsCount.toString(),
      icon: HelpCircle,
    },
    {
      label: "Tổng thu nhập",
      value: formatCurrency(stats.earnings),
      icon: Coins,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  {item.value}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
