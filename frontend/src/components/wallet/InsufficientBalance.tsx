"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
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

interface InsufficientBalanceProps {
  open: boolean;
  onClose: () => void;
  requiredAmount: number;
  currentBalance: number;
}

export function InsufficientBalance({
  open,
  onClose,
  requiredAmount,
  currentBalance,
}: InsufficientBalanceProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            Số dư ví chưa đủ
          </DialogTitle>
          <DialogDescription>
            Bạn cần thêm tiền vào ví để tiếp tục đặt câu hỏi trả phí.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-[1.2rem] bg-muted/45 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Số dư hiện tại</span>
            <span className="font-semibold">{formatCurrency(currentBalance)}</span>
          </div>
          <div className="flex items-center justify-between rounded-[1.2rem] bg-muted/45 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Số tiền cần</span>
            <span className="font-semibold">{formatCurrency(requiredAmount)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Để sau
          </Button>
          <Button asChild>
            <Link href="/wallet">Mở ví</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
