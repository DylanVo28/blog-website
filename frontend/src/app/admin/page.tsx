"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DepositStatusBadge } from "@/components/payment/DepositStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { paymentApi } from "@/services/api/payment.api";
import type { AdminDepositItem } from "@/types/payment.types";

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AdminDepositsScreen() {
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#1d2f56,#2658a0_52%,#5f8ee0)] text-white">
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
            Admin Payment
          </p>
          <CardTitle className="text-white">Duyệt deposit MoMo QR</CardTitle>
          <CardDescription className="text-white/78">
            Chỉ các giao dịch MoMo QR cần đối soát thủ công mới xuất hiện tại đây. Luồng VCB QR sẽ tự cộng ví khi webhook khớp.
          </CardDescription>
        </CardHeader>
      </Card>

      {pendingQuery.isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner label="Đang tải danh sách deposit cần duyệt..." />
        </div>
      ) : pendingQuery.data?.items.length ? (
        <div className="space-y-4">
          {pendingQuery.data.items.map((item: AdminDepositItem) => (
            <Card key={item.id} className="border-border/80">
              <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-foreground">
                      {formatCurrency(item.amount)}
                    </h2>
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
      ) : (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="Không có deposit nào cần duyệt"
          description="Khi user tạo MoMo QR và xác nhận đã chuyển tiền, các yêu cầu thủ công sẽ xuất hiện tại đây."
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <AdminDepositsScreen />
    </AuthGuard>
  );
}
