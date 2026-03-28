import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface BalanceDisplayProps {
  balance: number;
  className?: string;
  caption?: string;
}

export function BalanceDisplay({
  balance,
  className,
  caption = "Số dư hiện tại",
}: BalanceDisplayProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm uppercase tracking-[0.22em] text-foreground/72">{caption}</p>
      <p className="font-serif text-4xl font-medium tracking-tight text-foreground md:text-5xl">
        {formatCurrency(balance)}
      </p>
    </div>
  );
}
