export type ManualDepositStatus =
  | "pending"
  | "user_confirmed"
  | "completed"
  | "failed"
  | "expired";

export interface ManualDeposit {
  id: string;
  userId: string;
  amount: number;
  depositCode: string | null;
  paymentMethod: string | null;
  paymentRef: string | null;
  receiverPhone: string | null;
  receiverName: string | null;
  status: ManualDepositStatus;
  userConfirmedAt: string | null;
  transferProofUrl: string | null;
  adminConfirmedBy: string | null;
  adminNote: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  completedAt: string | null;
}

export interface ManualDepositPaymentInfo {
  method: string;
  receiver: {
    phone: string | null;
    name: string | null;
  };
  qr: {
    imageDataUrl: string | null;
    deepLink: string | null;
    raw: string | null;
  };
  transferContent: string | null;
  instructions: string[];
}

export interface CreateManualDepositResult {
  deposit: ManualDeposit;
  payment: ManualDepositPaymentInfo;
}

export interface ConfirmManualDepositResult {
  message: string;
  deposit: ManualDeposit;
}

export interface PaymentMethodOption {
  method: string;
  label: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  enabled: boolean;
  expireMinutes: number;
  receiver: {
    phone: string | null;
    name: string | null;
  };
}

export interface ManualDepositHistoryResult {
  page: number;
  items: ManualDeposit[];
}

export interface AdminDepositItem extends ManualDeposit {
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
  } | null;
}

export interface PendingAdminDepositsResult {
  page: number;
  items: AdminDepositItem[];
}

export interface ReviewDepositResult {
  success: boolean;
  deposit: ManualDeposit;
}
