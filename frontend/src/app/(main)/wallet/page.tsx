"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Plus } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TransactionList } from "@/components/wallet/TransactionList";
import { WalletOverview } from "@/components/wallet/WalletOverview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { walletApi } from "@/services/api/wallet.api";
import { useWalletStore } from "@/stores/walletStore";

export default function WalletPage() {
  const setBalance = useWalletStore((state) => state.setBalance);

  const walletQuery = useQuery({
    queryKey: ["wallet", "overview"],
    queryFn: () => walletApi.getWallet(),
  });

  const earningsQuery = useQuery({
    queryKey: ["wallet", "earnings"],
    queryFn: () => walletApi.getEarnings(),
  });

  useEffect(() => {
    if (walletQuery.data) {
      setBalance(walletQuery.data.balance);
    }
  }, [setBalance, walletQuery.data]);

  return (
    <AuthGuard>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
              Wallet
            </p>
            <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight">Ví của tôi</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Theo dõi số dư hiện tại, tổng thu chi và toàn bộ giao dịch liên quan đến câu hỏi premium.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/wallet/deposit">
                <Plus className="size-4" />
                Nạp tiền
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/wallet/withdraw">
                <ArrowUpRight className="size-4" />
                Rút tiền
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <WalletOverview wallet={walletQuery.data} isLoading={walletQuery.isLoading} />

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Lịch sử giao dịch</CardTitle>
                <CardDescription>
                  Bao gồm nạp tiền, rút tiền, hoàn tiền và các khoản thanh toán premium question.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionList />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="paper-grid">
              <CardHeader>
                <CardTitle className="text-2xl">Tóm tắt rút tiền</CardTitle>
                <CardDescription>
                  Backend hiện trả thống kê earnings theo thời gian thực từ ví của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.25rem] border border-border/70 bg-white/70 px-4 py-4">
                  <p className="text-sm text-muted-foreground">Có thể rút ngay</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {earningsQuery.isLoading
                      ? "Đang tải..."
                      : new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          maximumFractionDigits: 0,
                        }).format(earningsQuery.data?.availableToWithdraw ?? 0)}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border/70 bg-white/70 px-4 py-4">
                  <p className="text-sm text-muted-foreground">Tổng thu nhập tích lũy</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(earningsQuery.data?.totalEarned ?? 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Ghi chú</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>Deposit MoMo QR cần bạn chuyển đúng nội dung và chờ admin xác nhận trước khi cộng ví.</p>
                <p>Withdraw hiện tạo yêu cầu `pending`, số dư chưa bị trừ cho đến khi admin duyệt.</p>
                <p>Khoản thu từ câu hỏi tác giả sẽ xuất hiện khi câu hỏi được trả lời và payout được giải ngân.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
