"use client";

import { useMutation } from "@tanstack/react-query";
import {
  BellRing,
  Bot,
  CircleDot,
  MessageSquareMore,
  RotateCcw,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/api";
import { getNotificationHref, getNotificationTypeLabel } from "@/lib/notifications";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { notificationsApi } from "@/services/api/notifications.api";
import { useNotificationStore } from "@/stores/notificationStore";
import type { Notification } from "@/types/notification.types";

interface NotificationItemProps {
  notification: Notification;
  mode?: "panel" | "page";
  onSelect?: () => void;
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "new_question":
      return <MessageSquareMore className="size-4" />;
    case "question_answered":
      return <Bot className="size-4" />;
    case "new_comment":
      return <MessageSquareMore className="size-4" />;
    case "question_refunded":
      return <RotateCcw className="size-4" />;
    case "earning_received":
      return <Wallet className="size-4" />;
    case "system":
    default:
      return <BellRing className="size-4" />;
  }
}

function getIconStyles(type: Notification["type"]) {
  switch (type) {
    case "new_question":
      return "bg-amber-100 text-amber-700";
    case "question_answered":
      return "bg-sky-100 text-sky-700";
    case "new_comment":
      return "bg-emerald-100 text-emerald-700";
    case "question_refunded":
      return "bg-rose-100 text-rose-700";
    case "earning_received":
      return "bg-violet-100 text-violet-700";
    case "system":
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

export function NotificationItem({
  notification,
  mode = "page",
  onSelect,
}: NotificationItemProps) {
  const router = useRouter();
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const href = getNotificationHref(notification);
  const markReadMutation = useMutation({
    mutationFn: () => notificationsApi.markRead(notification.id),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể đồng bộ trạng thái đã đọc."));
    },
  });

  const content = (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-[1.4rem] border px-4 py-4 text-left transition-colors",
        notification.isRead
          ? "border-border/70 bg-white/70 hover:bg-accent/50"
          : "border-primary/18 bg-primary/5 hover:bg-primary/8",
        mode === "panel" ? "shadow-none" : "shadow-sm",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl",
          getIconStyles(notification.type),
        )}
      >
        {getNotificationIcon(notification.type)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {getNotificationTypeLabel(notification.type)}
            </p>
            <p className="mt-1 font-semibold text-foreground">{notification.title}</p>
          </div>

          {!notification.isRead ? (
            <CircleDot className="mt-1 size-4 shrink-0 text-primary" />
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.message}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{formatRelativeTime(notification.createdAt)}</span>
          <span>{formatDateTime(notification.createdAt)}</span>
        </div>
      </div>

      <Sparkles className="mt-1 hidden size-4 shrink-0 text-primary/50 transition-transform group-hover:translate-x-0.5 sm:block" />
    </div>
  );

  const handleSelect = () => {
    markAsRead(notification.id);
    markReadMutation.mutate();
    onSelect?.();

    if (href) {
      router.push(href);
    }
  };

  return (
    <button type="button" className="w-full text-left" onClick={handleSelect}>
      {content}
    </button>
  );
}
