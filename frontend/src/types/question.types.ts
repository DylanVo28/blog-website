import type { AuthorInfo } from "@/types/user.types";

export type QuestionTarget = "author" | "ai";
export type QuestionStatus = "pending" | "answered" | "refunded" | "expired";

export interface Question {
  id: string;
  content: string;
  target: QuestionTarget;
  fee: number;
  status: QuestionStatus;
  answer: string | null;
  answeredAt: string | null;
  isHighlighted: boolean;
  deadlineAt: string | null;
  post: {
    id: string;
    title: string;
    slug: string;
  };
  asker: AuthorInfo;
  createdAt: string;
  updatedAt?: string;
}
