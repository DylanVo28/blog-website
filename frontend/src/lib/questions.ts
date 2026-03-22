import type {
  BackendQuestionRecord,
  Question,
  QuestionPostRef,
} from "@/types/question.types";
import type { AuthorInfo, UserProfile } from "@/types/user.types";

function fallbackAsker(record: BackendQuestionRecord): AuthorInfo {
  return {
    id: record.askerId,
    username: null,
    displayName: "Người dùng Inkline",
    avatarUrl: null,
    bio: null,
  };
}

export function buildAiQuestionFromSelection(selectedText: string) {
  return `Giải thích giúp tôi đoạn sau và cho tôi biết ý chính:\n\n"${selectedText.trim()}"`;
}

export function normalizeQuestionRecord(
  record: BackendQuestionRecord,
  asker: UserProfile | null,
  post?: QuestionPostRef | null,
): Question {
  return {
    id: record.id,
    postId: record.postId,
    askerId: record.askerId,
    content: record.content,
    target: record.target,
    fee: typeof record.fee === "string" ? Number(record.fee) : record.fee,
    status: record.status,
    answer: record.answer,
    answeredBy: record.answeredBy,
    answeredAt: record.answeredAt,
    isHighlighted: record.isHighlighted,
    deadlineAt: record.deadlineAt,
    post: post ?? {
      id: record.postId,
    },
    asker: asker ?? fallbackAsker(record),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
