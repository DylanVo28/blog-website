import apiClient from "@/services/api/client";
import { buildCommentTree, normalizeCommentRecord } from "@/lib/comments";
import { usersApi } from "@/services/api/users.api";
import type { ApiResponse } from "@/types/api.types";
import type {
  BackendCommentRecord,
  Comment,
  CommentCreateResult,
  CommentSuggestion,
  CreateCommentPayload,
  UpdateCommentPayload,
} from "@/types/comment.types";

interface CommentsListResult {
  postId: string;
  items: BackendCommentRecord[];
}

interface CommentCreateResponse {
  comment: BackendCommentRecord;
  suggestion: CommentSuggestion | null;
}

async function normalizeComments(records: BackendCommentRecord[]) {
  const authorsById = await usersApi.getPublicProfilesMap(records.map((record) => record.userId));
  return records.map((record) =>
    normalizeCommentRecord(record, authorsById[record.userId]),
  );
}

async function normalizeSingleComment(record: BackendCommentRecord): Promise<Comment> {
  const author = await usersApi.getPublicProfile(record.userId).catch(() => null);
  return normalizeCommentRecord(record, author);
}

export const commentsApi = {
  async getByPost(postId: string) {
    const response = await apiClient.get<ApiResponse<CommentsListResult>>(`/posts/${postId}/comments`);
    const comments = await normalizeComments(response.data.data.items);
    return buildCommentTree(comments);
  },

  async create(payload: CreateCommentPayload): Promise<CommentCreateResult> {
    const response = await apiClient.post<ApiResponse<CommentCreateResponse>>(
      `/posts/${payload.postId}/comments`,
      {
        content: payload.content,
        parentId: payload.parentId,
      },
    );

    return {
      comment: await normalizeSingleComment(response.data.data.comment),
      suggestion: response.data.data.suggestion,
    };
  },

  async update(commentId: string, payload: UpdateCommentPayload) {
    const response = await apiClient.patch<ApiResponse<BackendCommentRecord>>(
      `/comments/${commentId}`,
      payload,
    );

    return normalizeSingleComment(response.data.data);
  },

  async remove(commentId: string) {
    const response = await apiClient.delete<ApiResponse<{ id: string; removed: boolean }>>(
      `/comments/${commentId}`,
    );

    return response.data.data;
  },
};
