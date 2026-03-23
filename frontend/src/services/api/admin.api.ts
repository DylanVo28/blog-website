import apiClient from "@/services/api/client";
import {
  normalizeAdminWithdrawalsResult,
  normalizeWithdrawalRequest,
} from "@/lib/wallet";
import type { ApiResponse } from "@/types/api.types";
import type {
  AdminWithdrawalsResult,
  WithdrawalRequest,
} from "@/types/wallet.types";

export const adminApi = {
  async getWithdrawals() {
    const response = await apiClient.get<ApiResponse<AdminWithdrawalsResult>>("/admin/withdrawals");
    return normalizeAdminWithdrawalsResult(response.data.data);
  },

  async approveWithdrawal(withdrawalId: string) {
    const response = await apiClient.patch<ApiResponse<WithdrawalRequest>>(
      `/admin/withdrawals/${withdrawalId}/approve`,
      {},
    );

    return normalizeWithdrawalRequest(response.data.data);
  },

  async rejectWithdrawal(withdrawalId: string) {
    const response = await apiClient.patch<ApiResponse<WithdrawalRequest>>(
      `/admin/withdrawals/${withdrawalId}/reject`,
      {},
    );

    return normalizeWithdrawalRequest(response.data.data);
  },
};
