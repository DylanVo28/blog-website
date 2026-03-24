import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api.types";
import type { Notification } from "@/types/notification.types";

interface NotificationsResult {
  items: Notification[];
}

export const notificationsApi = {
  async getMine() {
    const response = await apiClient.get<ApiResponse<NotificationsResult>>("/notifications");
    return response.data.data.items;
  },

  async markRead(notificationId: string) {
    const response = await apiClient.patch<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`,
    );

    return response.data.data;
  },

  async markAllRead() {
    const response = await apiClient.patch<
      ApiResponse<{ updated: boolean; readAt: string }>
    >("/notifications/read-all");

    return response.data.data;
  },
};
