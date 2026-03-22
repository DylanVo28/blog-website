import type { AuthorInfo } from "@/types/user.types";

export type QuestionTarget = "author" | "ai";
export type QuestionStatus = "pending" | "answered" | "refunded" | "expired";

export interface QuestionPostRef {
  id: string;
  title?: string | null;
  slug?: string | null;
}

export interface Question {
  id: string;
  postId: string;
  askerId: string;
  content: string;
  target: QuestionTarget;
  fee: number;
  status: QuestionStatus;
  answer: string | null;
  answeredBy: string | null;
  answeredAt: string | null;
  isHighlighted: boolean;
  deadlineAt: string | null;
  post: QuestionPostRef | null;
  asker: AuthorInfo;
  createdAt: string;
  updatedAt: string;
}

export interface BackendQuestionRecord {
  id: string;
  postId: string;
  askerId: string;
  target: QuestionTarget;
  content: string;
  answer: string | null;
  answeredBy: string | null;
  fee: number | string;
  transactionId: string | null;
  status: QuestionStatus;
  isHighlighted: boolean;
  deadlineAt: string | null;
  answeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionPayload {
  postId: string;
  content: string;
  target: QuestionTarget;
  fee?: number;
}

export interface QuestionPrefill {
  content: string;
  target: QuestionTarget;
  nonce: number;
}
