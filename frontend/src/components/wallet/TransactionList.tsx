"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Filter } from "lucide-react";
import { walletApi } from "@/services/api/wallet.api";
import { useWalletStore } from "@/stores/walletStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TransactionItem } from "@/components/wallet/TransactionItem";
import type { Transaction } from "@/types/wallet.types";

type TransactionFilter = "all" | "income" | "expense";

interface TransactionListProps {
  className?: string;
}

export function TransactionList({ className }: TransactionListProps) {
  const setTransactions = useWalletStore((state) => state.setTransactions);
  const [filter, setFilter] = useState<TransactionFilter>("all");

  const transactionsQuery = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: () => walletApi.getTransactions(),
  });

  useEffect(() => {
    if (transactionsQuery.data) {
      setTransactions(transactionsQuery.data);
    }
  }, [setTransactions, transactionsQuery.data]);

  const transactions = transactionsQuery.data ?? [];
  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "income") {
      return transaction.direction === "in";
    }

    if (filter === "expense") {
      return transaction.direction === "out";
    }

    return true;
  });

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="surface-panel inline-flex items-center gap-2 rounded-full border border-border/70 bg-[color-mix(in_oklab,var(--color-card)_84%,transparent)] px-4 py-2 text-sm text-muted-foreground">
          <Filter className="size-4 text-primary" />
          Lọc giao dịch
        </div>
        <div className="flex gap-2">
          {([
            ["all", "Tất cả"],
            ["income", "Tiền vào"],
            ["expense", "Tiền ra"],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {transactionsQuery.isLoading ? (
        <div className="flex min-h-[18rem] items-center justify-center">
          <LoadingSpinner label="Đang tải lịch sử giao dịch..." />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="size-6" />}
          title="Chưa có giao dịch phù hợp"
          description="Khi bạn nạp tiền, rút tiền hoặc dùng ví cho câu hỏi trả phí, lịch sử sẽ xuất hiện tại đây."
        />
      ) : (
        <ScrollArea className="max-h-[32rem]">
          <div className="space-y-3 pr-4">
            {filteredTransactions.map((transaction: Transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
