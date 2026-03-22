import {
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  CreditCard,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Transaction, TransactionStatus } from "@/types/wallet.types";

const iconMap = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  question_to_author: HelpCircle,
  question_to_ai: Bot,
  refund: RotateCcw,
  withdrawal_fee: ArrowUpRight,
  bonus: CreditCard,
};

const statusLabelMap: Record<TransactionStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const Icon = iconMap[transaction.type] ?? CreditCard;
  const isPositive = transaction.direction === "in";
  const amountPrefix = isPositive ? "+" : transaction.direction === "out" ? "-" : "";

  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-border/70 bg-white/70 px-4 py-4 transition-colors hover:bg-accent/40">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "rounded-full p-2.5",
            isPositive
              ? "bg-emerald-100 text-emerald-700"
              : transaction.direction === "out"
                ? "bg-amber-100 text-amber-800"
                : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{transaction.label}</p>
            <Badge variant={transaction.status === "completed" ? "outline" : "secondary"}>
              {statusLabelMap[transaction.status]}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {transaction.description}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelativeTime(transaction.createdAt)}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-base font-semibold",
            isPositive
              ? "text-emerald-700"
              : transaction.direction === "out"
                ? "text-amber-800"
                : "text-foreground",
          )}
        >
          {amountPrefix}
          {formatCurrency(transaction.amount)}
        </p>
      </div>
    </div>
  );
}
