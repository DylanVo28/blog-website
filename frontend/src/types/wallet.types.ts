export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "question_to_author"
  | "question_to_ai"
  | "refund"
  | "withdrawal_fee"
  | "bonus";

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  balanceAfter?: number | null;
  relatedQuestionId?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  createdAt: string;
  updatedAt?: string;
}
