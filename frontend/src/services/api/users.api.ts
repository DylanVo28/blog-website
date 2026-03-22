import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api.types";
import type { UserProfile } from "@/types/user.types";

async function getPublicProfile(userId: string) {
  const response = await apiClient.get<ApiResponse<UserProfile>>(`/users/${userId}`);
  return response.data.data;
}

async function getPublicProfilesMap(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async (userId) => {
      try {
        return [userId, await getPublicProfile(userId)] as const;
      } catch {
        return [userId, null] as const;
      }
    }),
  );

  return Object.fromEntries(entries) as Record<string, UserProfile | null>;
}

export const usersApi = {
  getPublicProfile,
  getPublicProfilesMap,
};
