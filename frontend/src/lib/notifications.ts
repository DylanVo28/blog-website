import type {
  IncomingNotification,
  Notification,
  NotificationData,
  NotificationType,
} from "@/types/notification.types";

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  new_question: "Câu hỏi mới",
  question_answered: "Đã có câu trả lời",
  new_comment: "Bình luận mới",
  question_refunded: "Hoàn tiền câu hỏi",
  earning_received: "Thu nhập mới",
  system: "Hệ thống",
};

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === "string" && value in NOTIFICATION_TYPE_LABELS;
}

function toIsoDate(value: unknown) {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }

  return new Date().toISOString();
}

function toNotificationData(value: unknown): NotificationData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as NotificationData;
}

function fallbackTitle(type: NotificationType) {
  return NOTIFICATION_TYPE_LABELS[type];
}

export function normalizeNotification(input: IncomingNotification): Notification {
  const type = isNotificationType(input.type) ? input.type : "system";
  const title = typeof input.title === "string" && input.title.trim().length > 0
    ? input.title.trim()
    : fallbackTitle(type);
  const message = typeof input.message === "string" && input.message.trim().length > 0
    ? input.message.trim()
    : "Bạn có một cập nhật mới trong tài khoản.";

  return {
    id:
      typeof input.id === "string" && input.id.trim().length > 0
        ? input.id
        : `${type}-${Date.now()}`,
    type,
    title,
    message,
    isRead: Boolean(input.isRead),
    data: toNotificationData(input.data),
    createdAt: toIsoDate(input.createdAt),
  };
}

export function sortNotifications(notifications: Notification[]) {
  return [...notifications].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function getNotificationHref(notification: Notification) {
  const { data, type } = notification;

  if (typeof data.href === "string" && data.href.startsWith("/")) {
    return data.href;
  }

  if (typeof data.route === "string" && data.route.startsWith("/")) {
    return data.route;
  }

  if (typeof data.postSlug === "string" && data.postSlug.length > 0) {
    if (type === "new_comment") {
      return `/posts/${data.postSlug}#comment-section`;
    }

    return `/posts/${data.postSlug}#question-section`;
  }

  if (typeof data.username === "string" && data.username.length > 0) {
    return `/profile/${data.username}`;
  }

  if (type === "earning_received" || type === "question_refunded") {
    return "/wallet";
  }

  return "/notifications";
}

export function getNotificationTypeLabel(type: NotificationType) {
  return NOTIFICATION_TYPE_LABELS[type];
}
