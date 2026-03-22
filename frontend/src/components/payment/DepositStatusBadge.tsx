import { Badge } from "@/components/ui/badge";
import type { ManualDepositStatus } from "@/types/payment.types";

const statusMap: Record<
  ManualDepositStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "success" }
> = {
  pending: {
    label: "Chờ chuyển tiền",
    variant: "outline",
  },
  user_confirmed: {
    label: "Chờ admin duyệt",
    variant: "default",
  },
  completed: {
    label: "Đã cộng ví",
    variant: "success",
  },
  failed: {
    label: "Bị từ chối",
    variant: "secondary",
  },
  expired: {
    label: "Hết hạn",
    variant: "secondary",
  },
};

interface DepositStatusBadgeProps {
  status: ManualDepositStatus;
}

export function DepositStatusBadge({ status }: DepositStatusBadgeProps) {
  const current = statusMap[status];
  return <Badge variant={current.variant}>{current.label}</Badge>;
}
