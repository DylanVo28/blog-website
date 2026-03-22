import apiClient from "@/services/api/client";
import { normalizeQuestionRecord } from "@/lib/questions";
import { usersApi } from "@/services/api/users.api";
import type { ApiResponse } from "@/types/api.types";
import type {
  BackendQuestionRecord,
  CreateQuestionPayload,
  QuestionPostRef,
} from "@/types/question.types";

interface QuestionListResult {
  postId?: string;
  userId?: string;
  authorId?: string;
  items: BackendQuestionRecord[];
}

async function normalizeQuestionList(
  records: BackendQuestionRecord[],
  post?: QuestionPostRef | null,
) {
  const askersById = await usersApi.getPublicProfilesMap(records.map((record) => record.askerId));
  return records.map((record) =>
    normalizeQuestionRecord(record, askersById[record.askerId], post),
  );
}

export const questionsApi = {
  async getByPost(postId: string, post?: QuestionPostRef | null) {
    const response = await apiClient.get<ApiResponse<QuestionListResult>>(`/posts/${postId}/questions`);
    return normalizeQuestionList(response.data.data.items, post ?? { id: postId });
  },

  async create(payload: CreateQuestionPayload, post?: QuestionPostRef | null) {
    const response = await apiClient.post<ApiResponse<BackendQuestionRecord>>(
      `/posts/${payload.postId}/questions`,
      {
        content: payload.content,
        target: payload.target,
        fee: payload.fee,
      },
    );

    const asker = await usersApi.getPublicProfile(response.data.data.askerId).catch(() => null);
    return normalizeQuestionRecord(response.data.data, asker, post ?? { id: payload.postId });
  },

  async answer(questionId: string, answer: string, post?: QuestionPostRef | null) {
    const response = await apiClient.post<ApiResponse<BackendQuestionRecord>>(
      `/questions/${questionId}/answer`,
      { answer },
    );

    const asker = await usersApi.getPublicProfile(response.data.data.askerId).catch(() => null);
    return normalizeQuestionRecord(response.data.data, asker, post ?? { id: response.data.data.postId });
  },

  async getMine() {
    const response = await apiClient.get<ApiResponse<QuestionListResult>>("/questions/my-questions");
    return normalizeQuestionList(response.data.data.items);
  },

  async getPending() {
    const response = await apiClient.get<ApiResponse<QuestionListResult>>("/questions/pending");
    return normalizeQuestionList(response.data.data.items);
  },
};
