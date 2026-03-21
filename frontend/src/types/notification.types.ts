export type NotificationType =
  | "new_question"
  | "question_answered"
  | "new_comment"
  | "question_refunded"
  | "earning_received"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown>;
  createdAt: string;
}
