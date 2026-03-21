import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api.types";
import type { Transaction, Wallet } from "@/types/wallet.types";

interface TransactionsResult {
  userId: string;
  items: Transaction[];
}

export const walletApi = {
  getWallet: () => apiClient.get<ApiResponse<Wallet>>("/wallet"),
  getTransactions: () =>
    apiClient.get<ApiResponse<TransactionsResult>>("/wallet/transactions"),
};
