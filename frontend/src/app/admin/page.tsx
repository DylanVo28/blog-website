"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  CheckCircle2,
  Clock3,
  Landmark,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DepositStatusBadge } from "@/components/payment/DepositStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { WithdrawalStatusBadge } from "@/components/wallet/WithdrawalStatusBadge";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { adminApi } from "@/services/api/admin.api";
import { paymentApi } from "@/services/api/payment.api";
import type { AdminDepositItem } from "@/types/payment.types";
import type { AdminWalletUserSummary, AdminWithdrawalItem } from "@/types/wallet.types";

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getUserLabel(user: AdminWalletUserSummary | null | undefined, fallbackId?: string | null) {
  if (!user) {
    return fallbackId || "Không rõ";
  }

  return user.displayName || user.email || user.id;
}

function AdminDepositsPanel() {
  const queryClient = useQueryClient();
  const pendingQuery = useQuery({
    queryKey: ["payment", "admin", "pending-deposits"],
    queryFn: () => paymentApi.getPendingDeposits(),
  });

  const reviewMutation = useMutation({
    mutationFn: (input: { depositId: string; approved: boolean }) =>
      paymentApi.reviewDeposit(input.depositId, {
        approved: input.approved,
      }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.approved ? "Đã duyệt deposit và cộng tiền vào ví." : "Đã từ chối deposit.",
      );
      void queryClient.invalidateQueries({ queryKey: ["payment", "admin", "pending-deposits"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể duyệt deposit."));
    },
  });

  if (pendingQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Đang tải danh sách deposit cần duyệt..." />
      </div>
    );
  }

  if (!pendingQuery.data?.items.length) {
    return (
      <EmptyState
        icon={<ShieldCheck className="size-6" />}
        title="Không có deposit nào cần duyệt"
        description="Khi user tạo MoMo QR và xác nhận đã chuyển tiền, các yêu cầu thủ công sẽ xuất hiện tại đây."
      />
    );
  }

  return (
    <div className="space-y-4">
      {pendingQuery.data.items.map((item: AdminDepositItem) => (
        <Card key={item.id} className="border-border/80">
          <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">{formatCurrency(item.amount)}</h2>
                <DepositStatusBadge status={item.status} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.3rem] border border-border/70 bg-white/80 p-4 text-sm leading-6 text-muted-foreground">
                  <p>
                    Người nạp:{" "}
                    <span className="font-semibold text-foreground">
                      {item.user?.displayName || item.user?.email || item.userId}
                    </span>
                  </p>
                  <p>
                    Email:{" "}
                    <span className="font-semibold text-foreground">
                      {item.user?.email || "Chưa có"}
                    </span>
                  </p>
                  <p>
                    User ID: <span className="font-mono text-foreground">{item.userId}</span>
                  </p>
                </div>

                <div className="rounded-[1.3rem] border border-border/70 bg-white/80 p-4 text-sm leading-6 text-muted-foreground">
                  <p>
                    Mã nạp:{" "}
                    <span className="font-mono font-semibold tracking-[0.16em] text-foreground">
                      {item.depositCode}
                    </span>
                  </p>
                  <p>
                    Tạo lúc:{" "}
                    <span className="font-semibold text-foreground">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </p>
                  <p>
                    Hết hạn:{" "}
                    <span className="font-semibold text-foreground">
                      {formatDateTime(item.expiresAt)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-[1.3rem] border border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Người nhận MoMo:{" "}
                  <span className="font-semibold text-foreground">
                    {item.receiverName} • {item.receiverPhone}
                  </span>
                </p>
                {item.transferProofUrl ? (
                  <p className="mt-2">
                    Proof:{" "}
                    <a
                      href={item.transferProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      Mở ảnh/chứng từ
                    </a>
                  </p>
                ) : (
                  <p className="mt-2">User chưa gửi proof.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-white/70 p-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Hành động
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Sau khi duyệt, tiền sẽ được cộng ngay vào ví user và transaction `deposit` được tạo.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  className="w-full"
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    void reviewMutation.mutateAsync({
                      depositId: item.id,
                      approved: true,
                    });
                  }}
                >
                  <CheckCircle2 className="size-4" />
                  Duyệt cộng tiền
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    void reviewMutation.mutateAsync({
                      depositId: item.id,
                      approved: false,
                    });
                  }}
                >
                  <XCircle className="size-4" />
                  Từ chối
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface WithdrawalCardProps {
  item: AdminWithdrawalItem;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}

function WithdrawalCard({ item, busy, onApprove, onReject }: WithdrawalCardProps) {
  const isPending = item.status === "pending";
  const resolvedBy =
    item.approvedByAdmin || item.approvedBy
      ? getUserLabel(item.approvedByAdmin, item.approvedBy)
      : "Chưa có";

  return (
    <Card className="overflow-hidden border-border/80">
      <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">{formatCurrency(item.amount)}</h2>
            <WithdrawalStatusBadge status={item.status} />
            {item.feeAmount > 0 ? <Badge variant="outline">Phí {formatCurrency(item.feeAmount)}</Badge> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[1.3rem] border border-border/70 bg-white/80 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold uppercase tracking-[0.18em] text-primary/70">Người rút</p>
              <p className="mt-2 text-foreground">{getUserLabel(item.user, item.userId)}</p>
              <p>Email: <span className="font-semibold text-foreground">{item.user?.email || "Chưa có"}</span></p>
              <p>
                Vai trò: <span className="font-semibold text-foreground">{item.user?.role || "Không rõ"}</span>
              </p>
              <p>
                User ID: <span className="font-mono text-foreground">{item.userId}</span>
              </p>
            </div>

            <div className="rounded-[1.3rem] border border-border/70 bg-white/80 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold uppercase tracking-[0.18em] text-primary/70">Ngân hàng nhận</p>
              <p className="mt-2 text-foreground">{item.bankName || "Chưa có"}</p>
              <p>
                Số tài khoản:{" "}
                <span className="font-semibold text-foreground">{item.bankAccount || "Chưa có"}</span>
              </p>
              <p>
                Chủ tài khoản:{" "}
                <span className="font-semibold text-foreground">{item.bankHolder || "Chưa có"}</span>
              </p>
            </div>

            <div className="rounded-[1.3rem] border border-border/70 bg-white/80 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold uppercase tracking-[0.18em] text-primary/70">Đối soát</p>
              <p className="mt-2">
                Chuyển khoản: <span className="font-semibold text-foreground">{formatCurrency(item.amount)}</span>
              </p>
              <p>
                Tổng trừ ví: <span className="font-semibold text-foreground">{formatCurrency(item.totalDebit)}</span>
              </p>
              <p>
                Tạo lúc: <span className="font-semibold text-foreground">{formatDateTime(item.createdAt)}</span>
              </p>
            </div>
          </div>

          <div className="rounded-[1.3rem] border border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
            <p>
              Người xử lý: <span className="font-semibold text-foreground">{resolvedBy}</span>
            </p>
            <p>
              Hoàn tất/Từ chối lúc:{" "}
              <span className="font-semibold text-foreground">{formatDateTime(item.completedAt)}</span>
            </p>
            <p>
              Withdrawal ID: <span className="font-mono text-foreground">{item.id}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-white/70 p-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Hành động</p>
            {isPending ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Khi duyệt, hệ thống sẽ trừ {formatCurrency(item.totalDebit)} khỏi ví user, tạo transaction
                `withdrawal` và hạch toán `withdrawal_fee` nếu có phí.
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Yêu cầu này đã được xử lý. Backend hiện đã khóa thao tác lặp để tránh duyệt lại cùng một lệnh.
              </p>
            )}
          </div>

          {isPending ? (
            <div className="space-y-3">
              <Button type="button" className="w-full" disabled={busy} onClick={onApprove}>
                <CheckCircle2 className="size-4" />
                Duyệt và hoàn tất
              </Button>
              <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={onReject}>
                <XCircle className="size-4" />
                Từ chối yêu cầu
              </Button>
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
              Trạng thái hiện tại:{" "}
              <span className="font-semibold text-foreground">
                {item.status === "completed"
                  ? "đã hoàn tất chuyển khoản"
                  : item.status === "approved"
                    ? "đã duyệt"
                    : "đã bị từ chối"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminWithdrawalsPanel() {
  const queryClient = useQueryClient();
  const withdrawalsQuery = useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: () => adminApi.getWithdrawals(),
  });

  const reviewMutation = useMutation({
    mutationFn: (input: { withdrawalId: string; action: "approve" | "reject" }) =>
      input.action === "approve"
        ? adminApi.approveWithdrawal(input.withdrawalId)
        : adminApi.rejectWithdrawal(input.withdrawalId),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Đã duyệt withdrawal và đánh dấu hoàn tất."
          : "Đã từ chối yêu cầu rút tiền.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể xử lý yêu cầu rút tiền."));
    },
  });

  if (withdrawalsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Đang tải danh sách withdrawal..." />
      </div>
    );
  }

  const items = withdrawalsQuery.data?.items ?? [];
  const pendingItems = items.filter((item) => item.status === "pending");
  const processedItems = items.filter((item) => item.status !== "pending");
  const pendingTransferAmount = pendingItems.reduce((sum, item) => sum + item.amount, 0);
  const pendingDebitAmount = pendingItems.reduce((sum, item) => sum + item.totalDebit, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Chờ duyệt
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{pendingItems.length}</p>
            </div>
            <Clock3 className="size-5 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tiền cần chuyển
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {formatCurrency(pendingTransferAmount)}
              </p>
            </div>
            <Landmark className="size-5 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tổng trừ ví
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {formatCurrency(pendingDebitAmount)}
              </p>
            </div>
            <Wallet className="size-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      {pendingItems.length ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
              Pending Queue
            </p>
            <h2 className="text-2xl font-semibold text-foreground">Yêu cầu rút tiền đang chờ xử lý</h2>
          </div>

          {pendingItems.map((item) => (
            <WithdrawalCard
              key={item.id}
              item={item}
              busy={reviewMutation.isPending}
              onApprove={() => {
                void reviewMutation.mutateAsync({
                  withdrawalId: item.id,
                  action: "approve",
                });
              }}
              onReject={() => {
                void reviewMutation.mutateAsync({
                  withdrawalId: item.id,
                  action: "reject",
                });
              }}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<ArrowDownCircle className="size-6" />}
          title="Không có withdrawal nào chờ duyệt"
          description="Khi tác giả hoặc người dùng gửi yêu cầu rút tiền, danh sách pending sẽ xuất hiện ở đây để admin xử lý."
        />
      )}

      {processedItems.length ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
              Recent History
            </p>
            <h2 className="text-2xl font-semibold text-foreground">Lịch sử xử lý gần đây</h2>
          </div>

          {processedItems.map((item) => (
            <WithdrawalCard
              key={item.id}
              item={item}
              busy
              onApprove={() => undefined}
              onReject={() => undefined}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function AdminTreasuryScreen() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#173b2d,#24533e_45%,#8bb65a)] text-white">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
              Admin Treasury
            </Badge>
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white/90">
              Deposit + Withdraw
            </Badge>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl text-white">Bảng điều phối nạp và rút tiền</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7 text-white/78">
              Admin có thể duyệt deposit thủ công, xử lý withdrawal đang chờ và theo dõi lịch sử đối soát trong
              cùng một màn hình. Tab withdraw được ưu tiên để bạn thao tác payout nhanh hơn.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="withdrawals" className="space-y-2">
        <TabsList>
          <TabsTrigger value="withdrawals">Withdraw</TabsTrigger>
          <TabsTrigger value="deposits">Deposit</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals">
          <AdminWithdrawalsPanel />
        </TabsContent>

        <TabsContent value="deposits">
          <AdminDepositsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <AdminTreasuryScreen />
    </AuthGuard>
  );
}
