export type PaymentMethod = "vnpay" | "momo";
export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "question_to_author"
  | "question_to_ai"
  | "refund"
  | "withdrawal_fee"
  | "bonus";

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "completed";
export type TransactionDirection = "in" | "out" | "neutral";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletEarnings {
  userId: string;
  availableToWithdraw: number;
  totalEarned: number;
  totalSpent: number;
}

export interface PaymentRequest {
  provider: PaymentMethod;
  orderId: string;
  amount: number;
  paymentUrl: string;
}

export interface DepositOrder {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
  paymentRef: string | null;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  completedAt: string | null;
  paymentRequest: PaymentRequest;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  feeAmount: number;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  status: WithdrawalStatus;
  approvedBy: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AdminWalletUserSummary {
  id: string;
  email: string | null;
  username?: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
}

export interface AdminWithdrawalItem extends WithdrawalRequest {
  totalDebit: number;
  user: AdminWalletUserSummary | null;
  approvedByAdmin: AdminWalletUserSummary | null;
}

export interface AdminWithdrawalsResult {
  items: AdminWithdrawalItem[];
}

export interface Transaction {
  id: string;
  senderId: string | null;
  receiverId: string | null;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  direction: TransactionDirection;
  label: string;
  description: string;
  referenceId: string | null;
  referenceType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTransactionRecord {
  id: string;
  senderId: string | null;
  receiverId: string | null;
  amount: number | string;
  type: TransactionType;
  status: TransactionStatus;
  referenceId: string | null;
  referenceType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
