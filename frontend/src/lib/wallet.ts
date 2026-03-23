import type {
  BackendTransactionRecord,
  DepositOrder,
  PaymentRequest,
  Transaction,
  Wallet,
  WalletEarnings,
  WithdrawalRequest,
} from "@/types/wallet.types";

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return Number(value);
  }

  return 0;
}

export function normalizeWalletRecord(record: Wallet): Wallet {
  return {
    ...record,
    balance: toNumber(record.balance),
    totalEarned: toNumber(record.totalEarned),
    totalSpent: toNumber(record.totalSpent),
  };
}

export function normalizeWalletEarnings(record: WalletEarnings): WalletEarnings {
  return {
    ...record,
    availableToWithdraw: toNumber(record.availableToWithdraw),
    totalEarned: toNumber(record.totalEarned),
    totalSpent: toNumber(record.totalSpent),
  };
}

export function normalizePaymentRequest(record: PaymentRequest): PaymentRequest {
  return {
    ...record,
    amount: toNumber(record.amount),
  };
}

export function normalizeDepositOrder(record: DepositOrder): DepositOrder {
  return {
    ...record,
    amount: toNumber(record.amount),
    paymentRequest: normalizePaymentRequest(record.paymentRequest),
  };
}

export function normalizeWithdrawalRequest(record: WithdrawalRequest): WithdrawalRequest {
  return {
    ...record,
    amount: toNumber(record.amount),
    feeAmount: toNumber(record.feeAmount),
  };
}

function getTransactionDirection(record: BackendTransactionRecord, currentUserId: string) {
  if (record.receiverId === currentUserId && record.senderId !== currentUserId) {
    return "in" as const;
  }

  if (record.senderId === currentUserId && record.receiverId !== currentUserId) {
    return "out" as const;
  }

  if (record.type === "deposit" || record.type === "refund") {
    return "in" as const;
  }

  if (
    record.type === "withdrawal" ||
    record.type === "question_to_author" ||
    record.type === "question_to_ai" ||
    record.type === "withdrawal_fee"
  ) {
    return "out" as const;
  }

  return "neutral" as const;
}

function getTransactionLabel(record: BackendTransactionRecord, currentUserId: string) {
  const direction = getTransactionDirection(record, currentUserId);

  switch (record.type) {
    case "deposit":
      return "Nạp tiền";
    case "withdrawal":
      return "Rút tiền";
    case "question_to_author":
      return direction === "in" ? "Thu nhập câu hỏi" : "Đặt câu hỏi cho tác giả";
    case "question_to_ai":
      return direction === "in" ? "Thu từ AI" : "Hỏi AI";
    case "refund":
      return "Hoàn tiền";
    case "withdrawal_fee":
      return "Phí rút tiền";
    case "bonus":
      return record.metadata?.source === "author_question_payout"
        ? "Thu nhập trả lời"
        : "Thưởng hệ thống";
    default:
      return "Giao dịch";
  }
}

function getTransactionDescription(record: BackendTransactionRecord, currentUserId: string) {
  const direction = getTransactionDirection(record, currentUserId);
  const provider =
    typeof record.metadata?.provider === "string"
      ? formatProviderLabel(String(record.metadata.provider))
      : null;

  switch (record.type) {
    case "deposit":
      return provider ? `Nạp tiền thành công qua ${provider}.` : "Tiền đã được cộng vào ví.";
    case "withdrawal":
      return "Lệnh rút tiền đã được admin duyệt và hoàn tất.";
    case "question_to_author":
      return direction === "in"
        ? "Thu nhập từ một câu hỏi trả phí."
        : "Thanh toán để gửi câu hỏi ưu tiên cho tác giả.";
    case "question_to_ai":
      return "Thanh toán cho câu hỏi AI dựa trên nội dung bài viết.";
    case "refund":
      return "Tiền được hoàn lại về ví do câu hỏi không được xử lý.";
    case "withdrawal_fee":
      return "Phí phát sinh cho yêu cầu rút tiền.";
    case "bonus":
      return record.metadata?.source === "author_question_payout"
        ? "Khoản thanh toán được giải ngân sau khi bạn trả lời câu hỏi."
        : "Khoản cộng thêm từ hệ thống.";
    default:
      return "Giao dịch nội bộ của ví.";
  }
}

function formatProviderLabel(provider: string) {
  if (provider === "vcb_qr") {
    return "VCB QR";
  }

  if (provider === "momo_qr") {
    return "MoMo QR";
  }

  if (provider === "vnpay") {
    return "VNPay";
  }

  if (provider === "momo") {
    return "MoMo";
  }

  return provider.toUpperCase();
}

export function normalizeTransactionRecord(
  record: BackendTransactionRecord,
  currentUserId: string,
): Transaction {
  return {
    ...record,
    amount: toNumber(record.amount),
    direction: getTransactionDirection(record, currentUserId),
    label: getTransactionLabel(record, currentUserId),
    description: getTransactionDescription(record, currentUserId),
    referenceId: record.referenceId ?? null,
    referenceType: record.referenceType ?? null,
    metadata: record.metadata ?? null,
    updatedAt: record.updatedAt,
  };
}
