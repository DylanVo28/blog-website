import apiClient from "@/services/api/client";
import {
  normalizeConfirmManualDepositResult,
  normalizeCreateManualDepositResult,
  normalizeManualDeposit,
  normalizeManualDepositHistory,
  normalizePaymentMethodOption,
  normalizePendingAdminDeposits,
  normalizeReviewDepositResult,
} from "@/lib/payment";
import type { ApiResponse } from "@/types/api.types";
import type {
  ConfirmManualDepositResult,
  CreateManualDepositResult,
  ManualDeposit,
  ManualDepositHistoryResult,
  PaymentMethodOption,
  PendingAdminDepositsResult,
  ReviewDepositResult,
} from "@/types/payment.types";

interface PaymentMethodsResult {
  items: PaymentMethodOption[];
}

export const paymentApi = {
  async getPaymentMethods() {
    const response = await apiClient.get<ApiResponse<PaymentMethodsResult>>("/payment/methods");
    return {
      items: response.data.data.items.map((item) => normalizePaymentMethodOption(item)),
    };
  },

  async createDeposit(payload: { amount: number; paymentMethod?: string }) {
    const response = await apiClient.post<ApiResponse<CreateManualDepositResult>>(
      "/payment/deposits",
      payload,
    );

    return normalizeCreateManualDepositResult(response.data.data);
  },

  async confirmTransfer(depositId: string, proofImageUrl?: string) {
    const response = await apiClient.post<ApiResponse<ConfirmManualDepositResult>>(
      `/payment/deposits/${depositId}/confirm`,
      {
        proofImageUrl,
      },
    );

    return normalizeConfirmManualDepositResult(response.data.data);
  },

  async getDepositStatus(depositId: string) {
    const response = await apiClient.get<ApiResponse<ManualDeposit>>(
      `/payment/deposits/${depositId}/status`,
    );

    return normalizeManualDeposit(response.data.data);
  },

  async getMyDeposits(page = 1) {
    const response = await apiClient.get<ApiResponse<ManualDepositHistoryResult>>(
      `/payment/deposits?page=${page}`,
    );

    return normalizeManualDepositHistory(response.data.data);
  },

  async getPendingDeposits(page = 1) {
    const response = await apiClient.get<ApiResponse<PendingAdminDepositsResult>>(
      `/payment/admin/deposits/pending?page=${page}`,
    );

    return normalizePendingAdminDeposits(response.data.data);
  },

  async reviewDeposit(depositId: string, payload: { approved: boolean; note?: string }) {
    const response = await apiClient.patch<ApiResponse<ReviewDepositResult>>(
      `/payment/admin/deposits/${depositId}`,
      payload,
    );

    return normalizeReviewDepositResult(response.data.data);
  },
};
