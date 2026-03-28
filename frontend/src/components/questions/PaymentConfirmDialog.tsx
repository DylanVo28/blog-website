"use client";

import { Bot, Shield, User } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { QuestionTarget } from "@/types/question.types";

interface PaymentConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  target: QuestionTarget;
  isLoading: boolean;
}

export function PaymentConfirmDialog({
  open,
  onClose,
  onConfirm,
  amount,
  target,
  isLoading,
}: PaymentConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận thanh toán câu hỏi</DialogTitle>
          <DialogDescription>
            Hệ thống sẽ trừ {formatCurrency(amount)} từ ví của bạn cho câu hỏi này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-[1.2rem] bg-muted/45 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Người trả lời</span>
            <span className="inline-flex items-center gap-2 font-semibold text-foreground">
              {target === "ai" ? (
                <Bot className="size-4 text-fuchsia-700 dark:text-fuchsia-300" />
              ) : (
                <User className="size-4 text-sky-700 dark:text-sky-300" />
              )}
              {target === "ai" ? "AI" : "Tác giả"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-[1.2rem] bg-muted/45 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Chi phí</span>
            <span className="font-semibold text-[color-mix(in_oklab,rgb(245,158,11)_76%,var(--color-foreground)_24%)]">
              {formatCurrency(amount)}
            </span>
          </div>

          {target === "author" ? (
            <div className="surface-panel flex items-start gap-3 rounded-[1.2rem] border border-[color-mix(in_oklab,var(--color-border)_52%,rgb(16,185,129)_48%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(16,185,129)_16%,transparent),transparent_54%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_90%,transparent),color-mix(in_oklab,var(--color-card)_78%,rgb(16,185,129)_22%))] px-4 py-3">
              <Shield className="mt-0.5 size-4 text-emerald-700 dark:text-emerald-300" />
              <p className="text-xs leading-6 text-foreground/88">
                Nếu tác giả không trả lời trong 48 giờ, backend sẽ hoàn tiền tự động cho bạn.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : `Thanh toán ${formatCurrency(amount)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
