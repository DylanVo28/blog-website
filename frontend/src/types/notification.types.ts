export type NotificationType =
  | "new_question"
  | "question_answered"
  | "new_comment"
  | "question_refunded"
  | "earning_received"
  | "system";

export interface NotificationData {
  href?: string;
  route?: string;
  postSlug?: string;
  username?: string;
  postId?: string;
  questionId?: string;
  commentId?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data: NotificationData;
  createdAt: string;
}

export type IncomingNotification = Partial<Notification> & {
  data?: NotificationData;
};
