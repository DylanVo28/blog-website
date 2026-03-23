import { Badge } from "@/components/ui/badge";
import type { WithdrawalStatus } from "@/types/wallet.types";

const statusMap: Record<
  WithdrawalStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "success" }
> = {
  pending: {
    label: "Chờ duyệt",
    variant: "outline",
  },
  approved: {
    label: "Đã duyệt",
    variant: "default",
  },
  rejected: {
    label: "Đã từ chối",
    variant: "secondary",
  },
  completed: {
    label: "Đã hoàn tất",
    variant: "success",
  },
};

interface WithdrawalStatusBadgeProps {
  status: WithdrawalStatus;
}

export function WithdrawalStatusBadge({
  status,
}: WithdrawalStatusBadgeProps) {
  const current = statusMap[status];
  return <Badge variant={current.variant}>{current.label}</Badge>;
}
