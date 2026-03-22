import apiClient from "@/services/api/client";
import { buildPostFormData, normalizePaginatedPosts, normalizePostRecord } from "@/lib/posts";
import { usersApi } from "@/services/api/users.api";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
  BackendPostRecord,
  BackendPostsListResult,
  CreatePostPayload,
  Post,
  PostStatus,
  UpdatePostPayload,
} from "@/types/post.types";
import type { UserProfile } from "@/types/user.types";

async function fetchAuthors(authorIds: string[]) {
  const uniqueIds = [...new Set(authorIds)];
  const profiles = await Promise.all(
    uniqueIds.map(async (authorId) => {
      try {
        const profile = await usersApi.getPublicProfile(authorId);
        return [authorId, profile] as const;
      } catch {
        return [authorId, null] as const;
      }
    }),
  );

  return Object.fromEntries(profiles) as Record<string, UserProfile | null>;
}

async function enrichPost(record: BackendPostRecord): Promise<Post> {
  let author: UserProfile | null = null;

  try {
    author = await usersApi.getPublicProfile(record.authorId);
  } catch {
    author = null;
  }

  return normalizePostRecord(record, author);
}

export interface ListPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PostStatus;
  categoryId?: string;
  tag?: string;
  authorId?: string;
}

export const postsApi = {
  async getAll(params: ListPostsParams = {}): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<ApiResponse<BackendPostsListResult>>("/posts", {
      params,
    });

    const authorsById = await fetchAuthors(response.data.data.items.map((item) => item.authorId));
    return normalizePaginatedPosts(response.data.data, authorsById);
  },

  async getBySlug(slug: string): Promise<Post> {
    const response = await apiClient.get<ApiResponse<BackendPostRecord>>(`/posts/${slug}`);
    return enrichPost(response.data.data);
  },

  async create(payload: CreatePostPayload): Promise<Post> {
    const response = await apiClient.post<ApiResponse<BackendPostRecord>>(
      "/posts",
      buildPostFormData(payload),
    );

    const post = await enrichPost(response.data.data);

    if (payload.status === "published") {
      return this.publish(post.id);
    }

    return post;
  },

  async update(postId: string, payload: UpdatePostPayload): Promise<Post> {
    const response = await apiClient.patch<ApiResponse<BackendPostRecord>>(
      `/posts/${postId}`,
      buildPostFormData(payload),
    );

    let post = await enrichPost(response.data.data);

    if (payload.status === "published" && post.status !== "published") {
      post = await this.publish(post.id);
    }

    return post;
  },

  async publish(postId: string): Promise<Post> {
    const response = await apiClient.post<ApiResponse<BackendPostRecord>>(
      `/posts/${postId}/publish`,
    );
    return enrichPost(response.data.data);
  },

  async remove(postId: string) {
    const response = await apiClient.delete<ApiResponse<{ id: string; archived: boolean }>>(
      `/posts/${postId}`,
    );
    return response.data.data;
  },

  async getMine(userId: string, params: Omit<ListPostsParams, "authorId"> = {}) {
    return this.getAll({
      ...params,
      authorId: userId,
    });
  },

  async getFeed() {
    const response = await apiClient.get<ApiResponse<{ userId: string | null; items: BackendPostRecord[] }>>(
      "/posts/feed",
    );

    const authorsById = await fetchAuthors(response.data.data.items.map((item) => item.authorId));
    return response.data.data.items.map((item) => normalizePostRecord(item, authorsById[item.authorId]));
  },
};
