import apiClient from "@/services/api/client";
import { normalizePostRecord } from "@/lib/posts";
import type { ApiResponse } from "@/types/api.types";
import type { BackendPostRecord, Post } from "@/types/post.types";
import type {
  UpdateProfilePayload,
  UserProfile,
  UserProfileStats,
} from "@/types/user.types";

interface UserPostsResult {
  userId: string;
  items: BackendPostRecord[];
}

async function getPublicProfile(identifier: string) {
  const response = await apiClient.get<ApiResponse<UserProfile>>(`/users/${identifier}`);
  return response.data.data;
}

async function getPublicProfilesMap(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async (identifier) => {
      try {
        return [identifier, await getPublicProfile(identifier)] as const;
      } catch {
        return [identifier, null] as const;
      }
    }),
  );

  return Object.fromEntries(entries) as Record<string, UserProfile | null>;
}

async function updateMe(payload: UpdateProfilePayload) {
  const response = await apiClient.patch<ApiResponse<UserProfile>>("/users/me", payload);
  return response.data.data;
}

async function getUserStats(identifier: string) {
  const response = await apiClient.get<ApiResponse<UserProfileStats>>(`/users/${identifier}/stats`);
  return response.data.data;
}

async function getUserPosts(identifier: string, author?: UserProfile): Promise<Post[]> {
  const [response, profile] = await Promise.all([
    apiClient.get<ApiResponse<UserPostsResult>>(`/users/${identifier}/posts`),
    author ? Promise.resolve(author) : getPublicProfile(identifier),
  ]);

  return response.data.data.items.map((item) => normalizePostRecord(item, profile));
}

export const usersApi = {
  getPublicProfile,
  getPublicProfilesMap,
  getUserStats,
  getUserPosts,
  updateMe,
};
