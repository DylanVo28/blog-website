"use client";

import { useState } from "react";
import { BarChart3, WalletCards } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buildEarningsTrend, type EarningsRange } from "@/lib/dashboard";
import { formatCompactNumber, formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/wallet.types";

interface EarningsChartProps {
  transactions?: Transaction[];
  availableToWithdraw?: number;
  isLoading?: boolean;
}

const ranges: EarningsRange[] = [7, 30];

export function EarningsChart({
  transactions = [],
  availableToWithdraw = 0,
  isLoading = false,
}: EarningsChartProps) {
  const [activeRange, setActiveRange] = useState<EarningsRange>(7);
  const data = buildEarningsTrend(transactions, activeRange);
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="paper-grid overflow-hidden">
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
            <BarChart3 className="size-3.5" />
            Earnings
          </div>
          <div>
            <CardTitle>Nhịp doanh thu từ câu hỏi trả phí</CardTitle>
            <CardDescription>
              Chỉ tính các khoản payout thực nhận từ câu hỏi cho tác giả, không trộn với nạp tiền
              hay hoàn tiền ví.
            </CardDescription>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-[1.2rem] border border-border/70 bg-white/85 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Có thể rút
            </p>
            {isLoading ? (
              <Skeleton className="mt-3 h-7 w-28" />
            ) : (
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatCurrency(availableToWithdraw)}
              </p>
            )}
          </div>

          <div className="inline-flex rounded-full border border-border/70 bg-white/80 p-1">
            {ranges.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setActiveRange(range)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  activeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {range} ngày
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="h-[320px] rounded-[1.5rem] border border-border/70 bg-white/82 p-4">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-[1.2rem]" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earnings-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(value: number) => formatCompactNumber(value)}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--color-primary)", strokeOpacity: 0.18 }}
                    formatter={(value) => [
                      formatCurrency(typeof value === "number" ? value : Number(value ?? 0)),
                      "Doanh thu",
                    ]}
                    contentStyle={{
                      borderRadius: 18,
                      borderColor: "var(--color-border)",
                      backgroundColor: "rgba(255,255,255,0.96)",
                      boxShadow: "0 18px 40px -28px rgba(25,32,56,0.35)",
                    }}
                    labelStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    fill="url(#earnings-gradient)"
                    activeDot={{ r: 5, fill: "var(--color-primary)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-border/70 bg-white/82 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tổng {activeRange} ngày
              </p>
              {isLoading ? (
                <Skeleton className="mt-3 h-9 w-32" />
              ) : (
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(total)}
                </p>
              )}
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Dùng mốc này để so sánh nhịp trả lời câu hỏi và xem ngày nào doanh thu tăng tốt
                nhất.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-white/82 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <WalletCards className="size-4 text-primary" />
                Gợi ý vận hành
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Nếu đường doanh thu bị phẳng quá lâu, hãy kiểm tra tab câu hỏi đang chờ để tránh
                mất payout do quá hạn 48 giờ.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
