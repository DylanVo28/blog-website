"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Landmark,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TimerReset,
  WalletCards,
} from "lucide-react";
import { DepositStatusBadge } from "@/components/payment/DepositStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { paymentApi } from "@/services/api/payment.api";
import type {
  CreateManualDepositResult,
  ManualDeposit,
  ManualDepositStatus,
  PaymentMethodOption,
} from "@/types/payment.types";

const METHOD_LABELS: Record<string, string> = {
  momo_qr: "MoMo QR",
  vcb_qr: "VCB QR",
  ocb_qr: "OCB QR",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isBankQrMethod(method: string | null | undefined) {
  return method === "vcb_qr" || method === "ocb_qr";
}

function formatMethodLabel(method: string | null | undefined) {
  if (!method) {
    return "Nạp tiền";
  }

  return METHOD_LABELS[method] ?? method;
}

function getHeroTitle(method: string | null | undefined, bankName: string | null | undefined) {
  if (method === "vcb_qr") {
    return "Vietcombank QR";
  }

  if (method === "ocb_qr") {
    return bankName ? `${bankName} QR` : "OCB QR";
  }

  return "MoMo QR Personal";
}

function getHeroClassName(method: string | null | undefined) {
  if (method === "vcb_qr") {
    return "border border-[color-mix(in_oklab,var(--color-border)_42%,rgb(16,185,129)_58%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(16,185,129)_24%,transparent),transparent_42%),linear-gradient(135deg,color-mix(in_oklab,var(--color-card)_62%,rgb(6,95,70)_38%),color-mix(in_oklab,var(--color-card)_42%,rgb(4,120,87)_58%)_56%,color-mix(in_oklab,var(--color-card)_30%,rgb(74,222,128)_70%))]";
  }

  if (method === "ocb_qr") {
    return "border border-[color-mix(in_oklab,var(--color-border)_42%,rgb(245,158,11)_58%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(245,158,11)_22%,transparent),transparent_42%),linear-gradient(135deg,color-mix(in_oklab,var(--color-card)_62%,rgb(124,45,18)_38%),color-mix(in_oklab,var(--color-card)_40%,rgb(194,65,12)_60%)_56%,color-mix(in_oklab,var(--color-card)_28%,rgb(251,191,36)_72%))]";
  }

  return "border border-[color-mix(in_oklab,var(--color-border)_42%,rgb(217,70,239)_58%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(217,70,239)_22%,transparent),transparent_42%),linear-gradient(135deg,color-mix(in_oklab,var(--color-card)_60%,rgb(88,28,135)_40%),color-mix(in_oklab,var(--color-card)_38%,rgb(190,24,93)_62%)_58%,color-mix(in_oklab,var(--color-card)_28%,rgb(244,114,182)_72%))]";
}

function getStepLabels(method: string | null | undefined) {
  return isBankQrMethod(method)
    ? ["Số tiền", "Quét QR", "Ngân hàng xác nhận", "Hoàn tất"]
    : ["Số tiền", "Quét QR", "Chờ duyệt", "Hoàn tất"];
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

function getDepositHeadline(method: string | null | undefined, status: ManualDepositStatus | null) {
  switch (status) {
    case "pending":
      return isBankQrMethod(method)
        ? "Quét QR ngân hàng và chuyển đúng nội dung"
        : "Quét QR và chuyển đúng nội dung";
    case "user_confirmed":
      return "Deposit đang chờ admin duyệt";
    case "completed":
      return "Ví đã được cộng tiền";
    case "failed":
      return "Deposit đã bị từ chối";
    case "expired":
      return "Mã QR này đã hết hạn";
    default:
      return isBankQrMethod(method)
        ? `Tạo yêu cầu nạp tiền ${formatMethodLabel(method)}`
        : "Tạo yêu cầu nạp tiền MoMo QR";
  }
}

function getHeroDescription(method: string | null | undefined, bankName: string | null | undefined) {
  if (method === "vcb_qr") {
    return "Tạo VietQR cho tài khoản Vietcombank và để hệ thống tự cộng ví khi webhook đối soát đúng nội dung chuyển khoản.";
  }

  if (method === "ocb_qr") {
    return `Tạo VietQR cho tài khoản ${bankName ?? "OCB"} và để hệ thống tự cộng ví khi webhook đối soát đúng nội dung chuyển khoản.`;
  }

  return "Giữ nguyên luồng MoMo QR cá nhân hiện tại: user quét QR, chuyển tiền và admin duyệt thủ công trước khi cộng ví.";
}

function getCreateSuccessMessage(method: string | null | undefined) {
  if (isBankQrMethod(method)) {
    return `Đã tạo mã nạp tiền ${formatMethodLabel(method)}.`;
  }

  return "Đã tạo mã nạp tiền MoMo QR.";
}

function getMethodCardMeta(method: string) {
  if (method === "vcb_qr") {
    return {
      icon: <Landmark className="size-5" />,
      iconClassName:
        "bg-[color-mix(in_oklab,rgb(16,185,129)_18%,transparent)] text-emerald-700 dark:text-emerald-300",
      activeClassName:
        "border-[color-mix(in_oklab,var(--color-border)_48%,rgb(16,185,129)_52%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(16,185,129)_16%,transparent),transparent_54%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_72%,rgb(16,185,129)_28%))] shadow-sm",
      idleClassName:
        "border-border/70 bg-[color-mix(in_oklab,var(--color-card)_84%,transparent)] hover:border-[color-mix(in_oklab,var(--color-border)_48%,rgb(16,185,129)_52%)]",
    };
  }

  if (method === "ocb_qr") {
    return {
      icon: <Landmark className="size-5" />,
      iconClassName:
        "bg-[color-mix(in_oklab,rgb(245,158,11)_18%,transparent)] text-amber-700 dark:text-amber-300",
      activeClassName:
        "border-[color-mix(in_oklab,var(--color-border)_48%,rgb(245,158,11)_52%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(245,158,11)_16%,transparent),transparent_54%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_72%,rgb(245,158,11)_28%))] shadow-sm",
      idleClassName:
        "border-border/70 bg-[color-mix(in_oklab,var(--color-card)_84%,transparent)] hover:border-[color-mix(in_oklab,var(--color-border)_48%,rgb(245,158,11)_52%)]",
    };
  }

  return {
    icon: <WalletCards className="size-5" />,
    iconClassName:
      "bg-[color-mix(in_oklab,rgb(217,70,239)_18%,transparent)] text-fuchsia-700 dark:text-fuchsia-300",
    activeClassName:
      "border-[color-mix(in_oklab,var(--color-border)_48%,rgb(217,70,239)_52%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(217,70,239)_16%,transparent),transparent_54%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_72%,rgb(217,70,239)_28%))] shadow-sm",
    idleClassName:
      "border-border/70 bg-[color-mix(in_oklab,var(--color-card)_84%,transparent)] hover:border-[color-mix(in_oklab,var(--color-border)_48%,rgb(217,70,239)_52%)]",
  };
}

function normalizePresetAmounts(method: PaymentMethodOption | null) {
  if (!method) {
    return [10_000, 50_000, 100_000, 200_000, 500_000, 1_000_000];
  }

  const base = method.allowedAmounts.length
    ? method.allowedAmounts
    : [method.minAmount, 50_000, 100_000, 200_000, 500_000, 1_000_000];

  return [...new Set(base)]
    .filter((value) => value >= method.minAmount && value <= method.maxAmount)
    .sort((left, right) => left - right);
}

export function DepositForm() {
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
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

  const enabledMethods = methodsQuery.data?.items.filter((item) => item.enabled) ?? [];
  const resolvedMethod = selectedMethod ?? enabledMethods[0]?.method ?? null;
  const activeMethod =
    enabledMethods.find((item) => item.method === resolvedMethod) ?? enabledMethods[0] ?? null;

  const currentMethod = currentDeposit?.payment.method ?? activeMethod?.method ?? null;
  const currentBankName =
    currentDeposit?.payment.receiver.bankName ?? activeMethod?.receiver.bankName ?? null;
  const isAutoConfirmFlow = currentDeposit?.payment.autoConfirm ?? activeMethod?.autoConfirm ?? false;
  const isCurrentBankFlow = isBankQrMethod(currentDeposit?.payment.method);
  const presets = normalizePresetAmounts(activeMethod);

  const createDepositMutation = useMutation({
    mutationFn: () => {
      if (!activeMethod) {
        throw new Error("Không có phương thức nạp tiền khả dụng.");
      }

      return paymentApi.createDeposit({
        amount,
        paymentMethod: activeMethod.method,
      });
    },
    onSuccess: (data) => {
      setCurrentDeposit(data);
      setProofImageUrl("");
      toast.success(getCreateSuccessMessage(data.payment.method));
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

      if (isAutoConfirmFlow && status === "pending") {
        return 5_000;
      }

      if (status === "user_confirmed") {
        return 5_000;
      }

      return false;
    },
  });

  const displayDeposit = statusQuery.data ?? currentDeposit?.deposit ?? null;
  const currentStatus = displayDeposit?.status ?? null;
  const stepLabels = getStepLabels(currentMethod);

  useEffect(() => {
    if (!statusQuery.data) {
      return;
    }

    if (statusQuery.data.status === "completed") {
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: ["payment", "my-deposits"] });
    }
  }, [queryClient, statusQuery.data]);

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
      setAmount(activeMethod.allowedAmounts[0] ?? activeMethod.minAmount);
    }
  }

  function validateSelectedAmount() {
    if (!activeMethod) {
      toast.error("Không có phương thức nạp tiền khả dụng.");
      return false;
    }

    if (amount < activeMethod.minAmount) {
      toast.error(`Số tiền nạp tối thiểu là ${formatCurrency(activeMethod.minAmount)}.`);
      return false;
    }

    if (amount > activeMethod.maxAmount) {
      toast.error(`Số tiền nạp tối đa là ${formatCurrency(activeMethod.maxAmount)}.`);
      return false;
    }

    if (activeMethod.allowedAmounts.length > 0 && !activeMethod.allowedAmounts.includes(amount)) {
      toast.error(
        `${activeMethod.label} chỉ hỗ trợ: ${activeMethod.allowedAmounts.map((value) => formatCurrency(value)).join(", ")}.`,
      );
      return false;
    }

    return true;
  }

  if (methodsQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Đang tải cấu hình phương thức nạp tiền..." />
      </div>
    );
  }

  if (!activeMethod) {
    return (
      <EmptyState
        title="Phương thức nạp tiền chưa sẵn sàng"
        description="Backend chưa trả về phương thức nào khả dụng. Hãy kiểm tra cấu hình MoMo QR, VCB QR hoặc OCB QR."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card
        className={cn(
          "overflow-hidden text-foreground shadow-[0_28px_90px_-50px_rgba(25,32,56,0.38)]",
          getHeroClassName(currentMethod),
        )}
      >
        <CardHeader className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary/80">
            {getHeroTitle(currentMethod, currentBankName)}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {stepLabels.map((label, index) => {
              const activeIndex = getStepIndex(currentStatus);
              const isActive = index <= activeIndex;

              return (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border text-sm font-semibold",
                      isActive
                        ? "border-border/60 bg-[color-mix(in_oklab,var(--color-card)_80%,transparent)] text-foreground"
                        : "border-border/45 bg-[color-mix(in_oklab,var(--color-card)_42%,transparent)] text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </div>
                  <span className={isActive ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </div>
              );
            })}
          </div>

          <div>
            <CardTitle className="text-foreground">
              {getDepositHeadline(currentMethod, currentStatus)}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {getHeroDescription(currentMethod, currentBankName)}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {!currentDeposit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Bước 1: Chọn phương thức và tạo mã nạp tiền</CardTitle>
            <CardDescription>
              Mỗi phương thức có giới hạn và thời gian hết hạn riêng. Hãy chọn cách nạp phù hợp trước khi tạo QR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              {enabledMethods.map((method) => {
                const meta = getMethodCardMeta(method.method);
                const isActive = method.method === activeMethod.method;

                return (
                  <button
                    key={method.method}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method.method);
                      setAmount(method.allowedAmounts[0] ?? method.minAmount);
                    }}
                    className={cn(
                      "surface-panel rounded-[1.4rem] border-2 p-4 text-left transition-all",
                      isActive ? meta.activeClassName : meta.idleClassName,
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn("rounded-full p-2", meta.iconClassName)}>{meta.icon}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{method.label}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{method.description}</p>
                        <p className="mt-3 text-sm text-muted-foreground">
                          Hạn dùng {method.expireMinutes} phút • {method.autoConfirm ? "Tự động đối soát" : "Admin duyệt thủ công"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

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
                  Mã đối soát riêng sẽ được sinh tự động để khớp giao dịch chính xác.
                </p>
                {activeMethod.allowedAmounts.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Mệnh giá hỗ trợ: {activeMethod.allowedAmounts.map((value) => formatCurrency(value)).join(", ")}.
                  </p>
                ) : null}
              </div>

              <div className="surface-panel rounded-[1.6rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_84%,transparent),color-mix(in_oklab,var(--color-muted)_60%,transparent))] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Thông tin nhận tiền
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">{activeMethod.receiver.name}</p>
                {isBankQrMethod(activeMethod.method) ? (
                  <>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeMethod.receiver.bankName} • {activeMethod.receiver.accountNumber}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      Hệ thống tạo VietQR cho tài khoản {activeMethod.receiver.bankName} và tự cộng ví khi webhook match đúng nội dung.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-muted-foreground">{activeMethod.receiver.phone}</p>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      Bạn sẽ quét QR MoMo cá nhân và xác nhận chuyển tiền để admin duyệt thủ công.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Đang chọn <span className="font-semibold text-foreground">{activeMethod.label}</span>.
              </p>
              <Button
                type="button"
                disabled={createDepositMutation.isPending}
                onClick={() => {
                  if (!validateSelectedAmount()) {
                    return;
                  }

                  void createDepositMutation.mutateAsync();
                }}
              >
                <QrCode className="size-4" />
                {createDepositMutation.isPending ? "Đang tạo mã..." : `Tạo QR ${formatMethodLabel(activeMethod.method)}`}
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
                  <CardTitle className="text-2xl">
                    {isCurrentBankFlow ? "Bước 2: Quét QR và chuyển khoản ngân hàng" : "Bước 2: Quét QR và chuyển tiền"}
                  </CardTitle>
                  <CardDescription>
                    Giao dịch hết hạn lúc {formatDateTime(displayDeposit.expiresAt)}.
                  </CardDescription>
                </div>
                <DepositStatusBadge status={displayDeposit.status} />
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-4">
                <div className="surface-panel rounded-[1.5rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent_52%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-4">
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
                    {isCurrentBankFlow
                      ? "Đây là mã đối soát để webhook ngân hàng khớp giao dịch. Nếu thay đổi nội dung này, hệ thống sẽ không thể tự cộng ví."
                      : "Đây là mã đối soát duy nhất. Nếu đổi nội dung này, admin sẽ khó xác nhận chính xác giao dịch."}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color-mix(in_oklab,rgb(245,158,11)_72%,var(--color-foreground)_28%)]">
                    {isCurrentBankFlow
                      ? "Hãy giữ nguyên đúng số tiền và nội dung. Sau khi chuyển thành công, hệ thống sẽ tự cập nhật khi SePay gửi webhook về."
                      : "QR MoMo cá nhân có thể chỉ tự điền người nhận và số tiền. Nếu app MoMo chưa hiện nội dung, hãy dán mã này thủ công vào ô lời nhắn."}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="surface-panel rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-4">
                    <p className="text-sm text-muted-foreground">Số tiền</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {formatCurrency(displayDeposit.amount)}
                    </p>
                  </div>
                  <div className="surface-panel rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-4">
                    <p className="text-sm text-muted-foreground">
                      {isCurrentBankFlow ? "Tài khoản nhận" : "Người nhận"}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {currentDeposit.payment.receiver.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isCurrentBankFlow
                        ? `${currentDeposit.payment.receiver.bankName} • ${currentDeposit.payment.receiver.accountNumber}`
                        : currentDeposit.payment.receiver.phone}
                    </p>
                  </div>
                </div>

                <div className="surface-panel rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-4">
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

                {!isCurrentBankFlow ? (
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
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  {currentDeposit.payment.qr.deepLink ? (
                    <Button asChild variant="outline">
                      <a href={currentDeposit.payment.qr.deepLink} target="_blank" rel="noreferrer">
                        <Smartphone className="size-4" />
                        Mở app MoMo
                      </a>
                    </Button>
                  ) : null}

                  {isCurrentBankFlow ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={statusQuery.isFetching}
                      onClick={() => {
                        void statusQuery.refetch();
                      }}
                    >
                      <RefreshCw className="size-4" />
                      {statusQuery.isFetching ? "Đang kiểm tra..." : "Kiểm tra giao dịch"}
                    </Button>
                  ) : (
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
                  )}

                  {isCurrentBankFlow ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        void copyToClipboard(
                          currentDeposit.payment.receiver.accountNumber,
                          "số tài khoản",
                        )
                      }
                    >
                      <Copy className="size-4" />
                      {copiedValue === "số tài khoản" ? "Đã sao chép" : "Sao chép STK"}
                    </Button>
                  ) : null}

                  <Button type="button" variant="ghost" onClick={resetFlow}>
                    Tạo mã mới
                  </Button>
                </div>
              </div>

              <div className="surface-panel space-y-4 rounded-[1.8rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent_56%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-5 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                  {isCurrentBankFlow
                    ? `VietQR ${currentDeposit.payment.receiver.bankName ?? formatMethodLabel(currentMethod)}`
                    : "MoMo QR"}
                </p>
                <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-[color-mix(in_oklab,var(--color-card)_92%,transparent)] p-3">
                  {currentDeposit.payment.qr.imageDataUrl ? (
                    <Image
                      src={currentDeposit.payment.qr.imageDataUrl}
                      alt={isCurrentBankFlow ? `Ma QR ${currentDeposit.payment.receiver.bankName ?? ""}` : "Ma QR MoMo"}
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
                  {isCurrentBankFlow
                    ? `Bạn có thể quét bằng ứng dụng ${currentDeposit.payment.receiver.bankName ?? "ngân hàng"} hoặc bất kỳ app ngân hàng nào hỗ trợ VietQR.`
                    : "Hãy kiểm tra đúng người nhận. Nếu MoMo chưa tự điền nội dung, hãy dán mã ở bên trái vào ô lời nhắn rồi mới chuyển tiền."}
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
                Phương thức: <span className="font-semibold text-foreground">{formatMethodLabel(displayDeposit.paymentMethod)}</span>
              </p>
              <p>
                Mã nạp: <span className="font-semibold text-foreground">{displayDeposit.depositCode}</span>
              </p>
              <p>
                Tạo lúc: <span className="font-semibold text-foreground">{formatDateTime(displayDeposit.createdAt)}</span>
              </p>
              <p>
                Hết hạn: <span className="font-semibold text-foreground">{formatDateTime(displayDeposit.expiresAt)}</span>
              </p>
              {isCurrentBankFlow ? (
                <>
                  <p>
                    Ngân hàng: <span className="font-semibold text-foreground">{displayDeposit.bankName}</span>
                  </p>
                  <p>
                    Số tài khoản: <span className="font-semibold text-foreground">{displayDeposit.accountNumber}</span>
                  </p>
                  <p>
                    Chủ tài khoản: <span className="font-semibold text-foreground">{displayDeposit.receiverName}</span>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Người nhận: <span className="font-semibold text-foreground">{displayDeposit.receiverName}</span>
                  </p>
                  <p>
                    Số điện thoại: <span className="font-semibold text-foreground">{displayDeposit.receiverPhone}</span>
                  </p>
                </>
              )}
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
                  Luồng này chỉ áp dụng cho MoMo QR. Trang đang polling trạng thái mỗi 5 giây.
                </CardDescription>
              </div>
              <DepositStatusBadge status={displayDeposit.status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <div className="surface-panel rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-5">
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
                <div className="surface-panel rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-4">
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatCurrency(displayDeposit.amount)}
                  </p>
                </div>
                <div className="surface-panel rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-4">
                  <p className="text-sm text-muted-foreground">Mã nạp</p>
                  <p className="mt-2 font-mono text-lg font-semibold tracking-[0.16em] text-foreground">
                    {displayDeposit.depositCode}
                  </p>
                </div>
              </div>

              {displayDeposit.transferProofUrl ? (
                <div className="surface-panel rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-4">
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
                <div className="surface-panel rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-4">
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

            <div className="surface-panel flex items-center justify-center rounded-[1.8rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_84%,transparent),color-mix(in_oklab,var(--color-muted)_58%,transparent))] p-6">
              <LoadingSpinner label="Đang chờ admin xác nhận giao dịch..." />
            </div>
          </CardContent>
        </Card>
      ) : displayDeposit?.status === "completed" ? (
        <Card className="overflow-hidden border border-[color-mix(in_oklab,var(--color-border)_42%,rgb(16,185,129)_58%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(16,185,129)_26%,transparent),transparent_42%),linear-gradient(135deg,color-mix(in_oklab,var(--color-card)_60%,rgb(6,95,70)_40%),color-mix(in_oklab,var(--color-card)_40%,rgb(5,150,105)_60%)_54%,color-mix(in_oklab,var(--color-card)_28%,rgb(110,231,183)_72%))] text-foreground shadow-[0_28px_90px_-50px_rgba(25,32,56,0.38)]">
          <CardHeader className="items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-full border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_72%,transparent)] text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-7" />
            </div>
            <div>
              <CardTitle className="text-foreground">Nạp tiền thành công</CardTitle>
              <CardDescription className="text-foreground/80">
                {formatCurrency(displayDeposit.amount)} đã được cộng vào ví của bạn qua{" "}
                {formatMethodLabel(displayDeposit.paymentMethod)}.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.3rem] border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_74%,transparent)] p-4">
                <p className="text-sm text-foreground/70">Mã nạp</p>
                <p className="mt-2 font-mono font-semibold tracking-[0.16em] text-foreground">
                  {displayDeposit.depositCode}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_74%,transparent)] p-4">
                <p className="text-sm text-foreground/70">Hoàn tất lúc</p>
                <p className="mt-2 font-semibold text-foreground">
                  {formatDateTime(displayDeposit.matchedAt ?? displayDeposit.completedAt)}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_74%,transparent)] p-4">
                <p className="text-sm text-foreground/70">Trạng thái</p>
                <p className="mt-2 font-semibold text-foreground">Đã cộng vào ví</p>
              </div>
            </div>

            {displayDeposit.adminNote ? (
              <div className="rounded-[1.3rem] border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_74%,transparent)] p-4 text-sm leading-6 text-foreground/90">
                {displayDeposit.adminNote}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/wallet">
                  Về ví của tôi
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-border/60 bg-[color-mix(in_oklab,var(--color-card)_72%,transparent)] text-foreground hover:bg-accent/60"
                onClick={resetFlow}
              >
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
            Bao gồm MoMo QR chờ duyệt thủ công và các luồng ngân hàng QR như VCB, OCB được đối soát tự động.
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
                className="surface-panel flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] px-4 py-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                    <DepositStatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatMethodLabel(item.paymentMethod)} • {item.depositCode ?? "Không có mã"} •{" "}
                    {formatDateTime(item.createdAt)}
                  </p>
                  {item.adminNote ? (
                    <p className="text-sm leading-6 text-muted-foreground">{item.adminNote}</p>
                  ) : null}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Hết hạn: {formatDateTime(item.expiresAt)}</p>
                  <p>Hoàn tất: {formatDateTime(item.matchedAt ?? item.completedAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<QrCode className="size-6" />}
              title="Chưa có yêu cầu nạp tiền nào"
              description="Tạo deposit đầu tiên để nhận QR MoMo hoặc QR ngân hàng và bắt đầu nạp tiền vào ví."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
