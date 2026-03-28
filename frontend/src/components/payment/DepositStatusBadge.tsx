import { Badge } from "@/components/ui/badge";
import type { ManualDepositStatus } from "@/types/payment.types";

const statusMap: Record<
  ManualDepositStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "success";
    className?: string;
  }
> = {
  pending: {
    label: "Chờ thanh toán",
    variant: "outline",
  },
  user_confirmed: {
    label: "Chờ admin duyệt",
    variant: "default",
  },
  completed: {
    label: "Đã cộng ví",
    variant: "success",
    className:
      "bg-[color-mix(in_oklab,rgb(16,185,129)_18%,transparent)] text-emerald-700 dark:text-emerald-300",
  },
  failed: {
    label: "Bị từ chối",
    variant: "secondary",
    className:
      "bg-[color-mix(in_oklab,rgb(239,68,68)_14%,transparent)] text-[color-mix(in_oklab,rgb(239,68,68)_72%,var(--color-foreground)_28%)]",
  },
  expired: {
    label: "Hết hạn",
    variant: "secondary",
    className:
      "bg-[color-mix(in_oklab,rgb(245,158,11)_14%,transparent)] text-[color-mix(in_oklab,rgb(245,158,11)_72%,var(--color-foreground)_28%)]",
  },
};

interface DepositStatusBadgeProps {
  status: ManualDepositStatus;
}

export function DepositStatusBadge({ status }: DepositStatusBadgeProps) {
  const current = statusMap[status];
  return (
    <Badge variant={current.variant} className={current.className}>
      {current.label}
    </Badge>
  );
}
