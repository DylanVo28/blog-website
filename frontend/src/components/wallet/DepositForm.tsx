"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TimerReset,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { paymentApi } from "@/services/api/payment.api";
import { DepositStatusBadge } from "@/components/payment/DepositStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type {
  CreateManualDepositResult,
  ManualDeposit,
  ManualDepositStatus,
} from "@/types/payment.types";

const STEP_LABELS = ["Số tiền", "Quét QR", "Chờ duyệt", "Hoàn tất"];

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStepIndex(status: ManualDepositStatus | null) {
  if (!status) {
    return 0;
  }

  if (status === "pending") {
    return 1;
  }

  if (status === "user_confirmed") {
    return 2;
  }

  return 3;
}

function getDepositHeadline(status: ManualDepositStatus | null) {
  switch (status) {
    case "pending":
      return "Quét QR và chuyển đúng nội dung";
    case "user_confirmed":
      return "Deposit đang chờ admin duyệt";
    case "completed":
      return "Ví đã được cộng tiền";
    case "failed":
      return "Deposit đã bị từ chối";
    case "expired":
      return "Mã QR này đã hết hạn";
    default:
      return "Tạo yêu cầu nạp tiền MoMo QR";
  }
}

export function DepositForm() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(10_000);
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [currentDeposit, setCurrentDeposit] = useState<CreateManualDepositResult | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const methodsQuery = useQuery({
    queryKey: ["payment", "methods"],
    queryFn: () => paymentApi.getPaymentMethods(),
  });

  const historyQuery = useQuery({
    queryKey: ["payment", "my-deposits"],
    queryFn: () => paymentApi.getMyDeposits(),
  });

  const activeMethod = methodsQuery.data?.items[0] ?? null;

  const createDepositMutation = useMutation({
    mutationFn: () =>
      paymentApi.createDeposit({
        amount,
        paymentMethod: "momo_qr",
      }),
    onSuccess: (data) => {
      setCurrentDeposit(data);
      setProofImageUrl("");
      toast.success("Đã tạo mã nạp tiền MoMo QR.");
      void queryClient.invalidateQueries({ queryKey: ["payment", "my-deposits"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể tạo yêu cầu nạp tiền."));
    },
  });

  const confirmTransferMutation = useMutation({
    mutationFn: () =>
      paymentApi.confirmTransfer(currentDeposit?.deposit.id ?? "", proofImageUrl.trim() || undefined),
    onSuccess: (result) => {
      setCurrentDeposit((previous) =>
        previous
          ? {
              ...previous,
              deposit: result.deposit,
            }
          : previous,
      );
      toast.success(result.message);
      void queryClient.invalidateQueries({ queryKey: ["payment", "my-deposits"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể xác nhận giao dịch."));
    },
  });

  const statusQuery = useQuery({
    queryKey: ["payment", "deposit-status", currentDeposit?.deposit.id],
    queryFn: () => paymentApi.getDepositStatus(currentDeposit?.deposit.id ?? ""),
    enabled: Boolean(currentDeposit?.deposit.id),
    refetchInterval: (query) => {
      const status = query.state.data?.status ?? currentDeposit?.deposit.status;

      if (status === "completed" || status === "failed" || status === "expired") {
        return false;
      }

      if (status === "user_confirmed") {
        return 5_000;
      }

      return false;
    },
  });

  const displayDeposit = statusQuery.data ?? currentDeposit?.deposit ?? null;
  const currentStatus = displayDeposit?.status ?? null;

  useEffect(() => {
    if (!statusQuery.data) {
      return;
    }

    if (statusQuery.data.status === "completed") {
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: ["payment", "my-deposits"] });
    }
  }, [queryClient, statusQuery.data]);

  const presets = useMemo(() => {
    const minAmount = activeMethod?.minAmount ?? 10_000;
    return [minAmount, 50_000, 100_000, 200_000, 500_000, 1_000_000];
  }, [activeMethod?.minAmount]);

  async function copyToClipboard(value: string | null | undefined, label: string) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(label);
      toast.success(`Đã sao chép ${label}.`);
      window.setTimeout(() => {
        setCopiedValue((current) => (current === label ? null : current));
      }, 1500);
    } catch {
      toast.error("Không thể sao chép. Hãy thử lại.");
    }
  }

  function resetFlow() {
    setCurrentDeposit(null);
    setProofImageUrl("");
    if (activeMethod) {
      setAmount(activeMethod.minAmount);
    }
  }

  if (methodsQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Đang tải cấu hình MoMo QR..." />
      </div>
    );
  }

  if (!activeMethod) {
    return (
      <EmptyState
        title="MoMo QR chưa sẵn sàng"
        description="Backend chưa trả về phương thức thanh toán nào. Hãy kiểm tra cấu hình MOMO_QR_PHONE và MOMO_QR_NAME."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#46215d,#bb2874_58%,#f17fa2)] text-white">
        <CardHeader className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
            MoMo QR Personal
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {STEP_LABELS.map((label, index) => {
              const activeIndex = getStepIndex(currentStatus);
              const isActive = index <= activeIndex;

              return (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full border text-sm font-semibold ${
                      isActive ? "border-white/30 bg-white/16 text-white" : "border-white/10 bg-white/5 text-white/55"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={isActive ? "text-white" : "text-white/60"}>{label}</span>
                </div>
              );
            })}
          </div>
          <div>
            <CardTitle className="text-white">{getDepositHeadline(currentStatus)}</CardTitle>
            <CardDescription className="text-white/80">
              Không cần tài khoản doanh nghiệp. User chuyển tiền tới MoMo cá nhân và admin duyệt thủ công trước khi cộng ví.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {!currentDeposit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Bước 1: Tạo mã nạp tiền</CardTitle>
            <CardDescription>
              Số tiền tối thiểu {formatCurrency(activeMethod.minAmount)}. Deposit sẽ hết hạn sau{" "}
              {activeMethod.expireMinutes} phút.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {presets.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset ? "default" : "outline"}
                  onClick={() => setAmount(preset)}
                >
                  {formatCurrency(preset)}
                </Button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground" htmlFor="deposit-amount">
                  Số tiền nạp
                </label>
                <Input
                  id="deposit-amount"
                  type="number"
                  min={activeMethod.minAmount}
                  max={activeMethod.maxAmount}
                  step={10_000}
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value || 0))}
                />
                <p className="text-sm text-muted-foreground">
                  Hệ thống sẽ tạo một mã nội dung riêng cho bạn để admin đối soát.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-border/70 bg-muted/30 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Người nhận
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">{activeMethod.receiver.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{activeMethod.receiver.phone}</p>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Bạn sẽ quét QR MoMo cá nhân và chuyển đúng nội dung để tránh đối soát nhầm.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Hệ thống hiện chỉ bật phương thức <span className="font-semibold text-foreground">{activeMethod.label}</span>.
              </p>
              <Button
                type="button"
                disabled={createDepositMutation.isPending}
                onClick={() => {
                  if (amount < activeMethod.minAmount) {
                    toast.error(`Số tiền nạp tối thiểu là ${formatCurrency(activeMethod.minAmount)}.`);
                    return;
                  }

                  if (amount > activeMethod.maxAmount) {
                    toast.error(`Số tiền nạp tối đa là ${formatCurrency(activeMethod.maxAmount)}.`);
                    return;
                  }

                  void createDepositMutation.mutateAsync();
                }}
              >
                <QrCode className="size-4" />
                {createDepositMutation.isPending ? "Đang tạo mã..." : "Tạo QR nạp tiền"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : displayDeposit?.status === "pending" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">Bước 2: Quét QR và chuyển tiền</CardTitle>
                  <CardDescription>
                    Giao dịch hết hạn lúc {formatDateTime(displayDeposit.expiresAt)}.
                  </CardDescription>
                </div>
                <DepositStatusBadge status={displayDeposit.status} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Nội dung chuyển khoản
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="font-mono text-2xl font-semibold tracking-[0.18em] text-foreground">
                      {currentDeposit.payment.transferContent}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyToClipboard(currentDeposit.payment.transferContent, "mã nạp")}
                    >
                      <Copy className="size-4" />
                      {copiedValue === "mã nạp" ? "Đã sao chép" : "Sao chép"}
                    </Button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Đây là mã đối soát duy nhất. Nếu đổi nội dung này, admin sẽ khó xác nhận chính xác giao dịch.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                    <p className="text-sm text-muted-foreground">Số tiền</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {formatCurrency(displayDeposit.amount)}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                    <p className="text-sm text-muted-foreground">Người nhận</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {currentDeposit.payment.receiver.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{currentDeposit.payment.receiver.phone}</p>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Các bước cần làm
                  </p>
                  <div className="mt-4 space-y-3">
                    {currentDeposit.payment.instructions.map((instruction, index) => (
                      <div key={instruction} className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="deposit-proof-url">
                    Ảnh proof chuyển khoản, nếu có
                  </label>
                  <Input
                    id="deposit-proof-url"
                    placeholder="https://... hoặc để trống"
                    value={proofImageUrl}
                    onChange={(event) => setProofImageUrl(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Bước này không bắt buộc, nhưng có thể giúp admin duyệt nhanh hơn.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {currentDeposit.payment.qr.deepLink ? (
                    <Button asChild variant="outline">
                      <a href={currentDeposit.payment.qr.deepLink} target="_blank" rel="noreferrer">
                        <Smartphone className="size-4" />
                        Mở app MoMo
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    disabled={confirmTransferMutation.isPending}
                    onClick={() => {
                      void confirmTransferMutation.mutateAsync();
                    }}
                  >
                    <ShieldCheck className="size-4" />
                    {confirmTransferMutation.isPending ? "Đang gửi xác nhận..." : "Tôi đã chuyển tiền"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetFlow}>
                    Tạo mã mới
                  </Button>
                </div>
              </div>

              <div className="space-y-4 rounded-[1.8rem] border border-border/70 bg-white/80 p-5 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                  MoMo QR
                </p>
                <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-white p-3">
                  {currentDeposit.payment.qr.imageDataUrl ? (
                    <Image
                      src={currentDeposit.payment.qr.imageDataUrl}
                      alt="Ma QR MoMo"
                      width={420}
                      height={420}
                      unoptimized
                      className="mx-auto h-auto w-full max-w-[260px]"
                    />
                  ) : (
                    <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
                      QR chưa sẵn sàng
                    </div>
                  )}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Hãy kiểm tra đúng người nhận và giữ nguyên nội dung trước khi xác nhận chuyển tiền.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="paper-grid">
            <CardHeader>
              <CardTitle className="text-2xl">Tóm tắt yêu cầu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                Mã nạp: <span className="font-semibold text-foreground">{displayDeposit.depositCode}</span>
              </p>
              <p>
                Tạo lúc: <span className="font-semibold text-foreground">{formatDateTime(displayDeposit.createdAt)}</span>
              </p>
              <p>
                Hết hạn: <span className="font-semibold text-foreground">{formatDateTime(displayDeposit.expiresAt)}</span>
              </p>
              <p>
                Người nhận: <span className="font-semibold text-foreground">{displayDeposit.receiverName}</span>
              </p>
              <p>
                Số điện thoại: <span className="font-semibold text-foreground">{displayDeposit.receiverPhone}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      ) : displayDeposit?.status === "user_confirmed" ? (
        <Card className="paper-grid">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Bước 3: Chờ admin duyệt</CardTitle>
                <CardDescription>
                  Trang này đang polling trạng thái mỗi 5 giây. Bạn có thể giữ nguyên tab này.
                </CardDescription>
              </div>
              <DepositStatusBadge status={displayDeposit.status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-border/70 bg-white/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <TimerReset className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Admin sẽ đối soát thủ công</p>
                    <p className="text-sm text-muted-foreground">
                      Khi deposit được duyệt, ví và wallet badge sẽ tự cập nhật sau lần polling kế tiếp.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatCurrency(displayDeposit.amount)}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                  <p className="text-sm text-muted-foreground">Mã nạp</p>
                  <p className="mt-2 font-mono text-lg font-semibold tracking-[0.16em] text-foreground">
                    {displayDeposit.depositCode}
                  </p>
                </div>
              </div>

              {displayDeposit.transferProofUrl ? (
                <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                  <p className="text-sm text-muted-foreground">Proof đã gửi</p>
                  <a
                    href={displayDeposit.transferProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
                  >
                    Xem proof chuyển khoản
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              ) : null}

              {displayDeposit.adminNote ? (
                <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                  <p className="text-sm text-muted-foreground">Ghi chú admin</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{displayDeposit.adminNote}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={statusQuery.isFetching}
                  onClick={() => {
                    void statusQuery.refetch();
                  }}
                >
                  <RefreshCw className="size-4" />
                  {statusQuery.isFetching ? "Đang kiểm tra..." : "Kiểm tra ngay"}
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/wallet">Về ví</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-[1.8rem] border border-border/70 bg-white/70 p-6">
              <LoadingSpinner label="Đang chờ admin xác nhận giao dịch..." />
            </div>
          </CardContent>
        </Card>
      ) : displayDeposit?.status === "completed" ? (
        <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,rgba(176,243,215,0.45),transparent_42%),linear-gradient(135deg,#14532d,#1d8c5d_54%,#65d59a)] text-white">
          <CardHeader className="items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <CheckCircle2 className="size-7" />
            </div>
            <div>
              <CardTitle className="text-white">Nạp tiền thành công</CardTitle>
              <CardDescription className="text-white/80">
                {formatCurrency(displayDeposit.amount)} đã được cộng vào ví của bạn.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.3rem] border border-white/20 bg-white/10 p-4">
                <p className="text-sm text-white/70">Mã nạp</p>
                <p className="mt-2 font-mono font-semibold tracking-[0.16em] text-white">
                  {displayDeposit.depositCode}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-white/20 bg-white/10 p-4">
                <p className="text-sm text-white/70">Duyệt lúc</p>
                <p className="mt-2 font-semibold text-white">
                  {formatDateTime(displayDeposit.completedAt)}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-white/20 bg-white/10 p-4">
                <p className="text-sm text-white/70">Trạng thái</p>
                <p className="mt-2 font-semibold text-white">Đã cộng vào ví</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/wallet">
                  Về ví của tôi
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button type="button" variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10" onClick={resetFlow}>
                Tạo deposit mới
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Deposit không thể tiếp tục</CardTitle>
                <CardDescription>
                  Mã nạp hiện tại đã {displayDeposit?.status === "expired" ? "hết hạn" : "bị từ chối"}.
                </CardDescription>
              </div>
              <DepositStatusBadge status={displayDeposit?.status ?? "failed"} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayDeposit?.adminNote ? (
              <p className="rounded-[1.3rem] border border-border/70 bg-muted/20 p-4 text-sm leading-6 text-foreground">
                {displayDeposit.adminNote}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={resetFlow}>
                Tạo mã nạp mới
              </Button>
              <Button asChild variant="outline">
                <Link href="/wallet">Về ví</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lịch sử nạp tiền gần đây</CardTitle>
          <CardDescription>
            Bao gồm các deposit đang chờ duyệt, đã cộng ví, bị từ chối hoặc hết hạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {historyQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <LoadingSpinner label="Đang tải lịch sử nạp tiền..." />
            </div>
          ) : historyQuery.data?.items.length ? (
            historyQuery.data.items.map((item: ManualDeposit) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-border/70 bg-white/80 px-4 py-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                    <DepositStatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.depositCode ?? "Không có mã"} • {formatDateTime(item.createdAt)}
                  </p>
                  {item.adminNote ? (
                    <p className="text-sm leading-6 text-muted-foreground">{item.adminNote}</p>
                  ) : null}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Hết hạn: {formatDateTime(item.expiresAt)}</p>
                  <p>Hoàn tất: {formatDateTime(item.completedAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<QrCode className="size-6" />}
              title="Chưa có yêu cầu nạp tiền nào"
              description="Tạo deposit đầu tiên để nhận QR MoMo cá nhân và bắt đầu nạp tiền vào ví."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
