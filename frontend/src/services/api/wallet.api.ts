import apiClient from "@/services/api/client";
import {
  normalizeDepositOrder,
  normalizeTransactionRecord,
  normalizeWalletEarnings,
  normalizeWalletRecord,
  normalizeWithdrawalRequest,
} from "@/lib/wallet";
import type { ApiResponse } from "@/types/api.types";
import type {
  BackendTransactionRecord,
  DepositOrder,
  PaymentMethod,
  Wallet,
  WalletEarnings,
  WithdrawalRequest,
} from "@/types/wallet.types";

interface TransactionsResult {
  userId: string;
  items: BackendTransactionRecord[];
}

export const walletApi = {
  async getWallet() {
    const response = await apiClient.get<ApiResponse<Wallet>>("/wallet");
    return normalizeWalletRecord(response.data.data);
  },

  async getTransactions(params?: { type?: string }) {
    const response = await apiClient.get<ApiResponse<TransactionsResult>>("/wallet/transactions", {
      params,
    });

    return response.data.data.items.map((item) =>
      normalizeTransactionRecord(item, response.data.data.userId),
    );
  },

  async createDeposit(payload: { amount: number; paymentMethod: PaymentMethod }) {
    const response = await apiClient.post<ApiResponse<DepositOrder>>("/wallet/deposit", payload);
    return normalizeDepositOrder(response.data.data);
  },

  async requestWithdraw(payload: {
    amount: number;
    bankName: string;
    bankAccount: string;
    bankHolder: string;
  }) {
    const response = await apiClient.post<ApiResponse<WithdrawalRequest>>(
      "/wallet/withdraw",
      payload,
    );
    return normalizeWithdrawalRequest(response.data.data);
  },

  async getEarnings() {
    const response = await apiClient.get<ApiResponse<WalletEarnings>>("/wallet/earnings");
    return normalizeWalletEarnings(response.data.data);
  },
};
