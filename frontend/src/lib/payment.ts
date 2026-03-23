import type {
  AdminDepositItem,
  ConfirmManualDepositResult,
  CreateManualDepositResult,
  ManualDeposit,
  ManualDepositHistoryResult,
  PaymentMethodOption,
  PendingAdminDepositsResult,
  ReviewDepositResult,
} from "@/types/payment.types";

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return Number(value);
  }

  return 0;
}

export function normalizeManualDeposit(record: ManualDeposit): ManualDeposit {
  return {
    ...record,
    amount: toNumber(record.amount),
  };
}

export function normalizeCreateManualDepositResult(
  record: CreateManualDepositResult,
): CreateManualDepositResult {
  return {
    ...record,
    deposit: normalizeManualDeposit(record.deposit),
  };
}

export function normalizeConfirmManualDepositResult(
  record: ConfirmManualDepositResult,
): ConfirmManualDepositResult {
  return {
    ...record,
    deposit: normalizeManualDeposit(record.deposit),
  };
}

export function normalizePaymentMethodOption(record: PaymentMethodOption): PaymentMethodOption {
  return {
    ...record,
    minAmount: toNumber(record.minAmount),
    maxAmount: toNumber(record.maxAmount),
    expireMinutes: toNumber(record.expireMinutes),
    allowedAmounts: Array.isArray(record.allowedAmounts)
      ? record.allowedAmounts.map((value) => toNumber(value))
      : [],
  };
}

export function normalizeManualDepositHistory(
  record: ManualDepositHistoryResult,
): ManualDepositHistoryResult {
  return {
    ...record,
    items: record.items.map((item) => normalizeManualDeposit(item)),
  };
}

export function normalizeAdminDepositItem(record: AdminDepositItem): AdminDepositItem {
  return {
    ...normalizeManualDeposit(record),
    user: record.user,
  };
}

export function normalizePendingAdminDeposits(
  record: PendingAdminDepositsResult,
): PendingAdminDepositsResult {
  return {
    ...record,
    items: record.items.map((item) => normalizeAdminDepositItem(item)),
  };
}

export function normalizeReviewDepositResult(record: ReviewDepositResult): ReviewDepositResult {
  return {
    ...record,
    deposit: normalizeManualDeposit(record.deposit),
  };
}
