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
              {target === "ai" ? <Bot className="size-4 text-fuchsia-700" /> : <User className="size-4 text-sky-700" />}
              {target === "ai" ? "AI" : "Tác giả"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-[1.2rem] bg-muted/45 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Chi phí</span>
            <span className="font-semibold text-amber-700">{formatCurrency(amount)}</span>
          </div>

          {target === "author" ? (
            <div className="flex items-start gap-3 rounded-[1.2rem] border border-emerald-200 bg-emerald-50/80 px-4 py-3">
              <Shield className="mt-0.5 size-4 text-emerald-700" />
              <p className="text-xs leading-6 text-emerald-900">
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
