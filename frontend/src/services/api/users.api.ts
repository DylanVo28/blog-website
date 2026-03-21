import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api.types";
import type { UserProfile } from "@/types/user.types";

export const usersApi = {
  getPublicProfile: async (userId: string) => {
    const response = await apiClient.get<ApiResponse<UserProfile>>(`/users/${userId}`);
    return response.data.data;
  },
};
