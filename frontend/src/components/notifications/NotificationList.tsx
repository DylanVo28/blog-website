"use client";

import Link from "next/link";
import { BellRing, CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotificationStore } from "@/stores/notificationStore";

interface NotificationListProps {
  mode?: "panel" | "page";
  onItemSelect?: () => void;
}

export function NotificationList({
  mode = "page",
  onItemSelect,
}: NotificationListProps) {
  const hydrated = useNotificationStore((state) => state.hydrated);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  if (!hydrated) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingSpinner label="Đang đồng bộ thông báo..." />
      </div>
    );
  }

  const listContent =
    notifications.length > 0 ? (
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            mode={mode}
            onSelect={onItemSelect}
          />
        ))}
      </div>
    ) : (
      <EmptyState
        icon={<BellRing className="size-6" />}
        title="Inbox đang trống"
        description="Khi có comment mới, câu hỏi được trả lời hoặc ví cập nhật, thông báo sẽ xuất hiện tại đây."
        actionHref="/"
        actionLabel="Khám phá bài viết"
      />
    );

  if (mode === "panel") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
                Realtime Inbox
              </p>
              <h3 className="mt-2 font-serif text-3xl font-medium tracking-tight">
                Thông báo
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {unreadCount > 0
                  ? `Bạn đang có ${unreadCount} thông báo chưa đọc.`
                  : "Mọi cập nhật mới sẽ xuất hiện ở đây ngay khi socket nhận được event."}
              </p>
            </div>

            {unreadCount > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => markAllAsRead()}>
                <CheckCheck className="size-4" />
                Đã đọc hết
              </Button>
            ) : null}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-4 py-4">{listContent}</ScrollArea>

        <div className="border-t border-border/70 px-6 py-4">
          <Button asChild className="w-full" variant="outline">
            <Link href="/notifications" onClick={onItemSelect}>
              Mở trang thông báo
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel rounded-[1.85rem] border border-border/70 shadow-[0_24px_70px_-46px_rgba(25,32,56,0.35)]">
      <div className="border-b border-border/70 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
              Activity Feed
            </p>
            <h2 className="mt-2 font-serif text-4xl font-medium tracking-tight">
              Thông báo realtime
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Theo dõi comment mới, câu hỏi nổi bật, phản hồi từ AI hoặc tác giả và các cập nhật
              liên quan đến ví của bạn trong một nơi duy nhất.
            </p>
          </div>

          {unreadCount > 0 ? (
            <Button type="button" variant="outline" onClick={() => markAllAsRead()}>
              <CheckCheck className="size-4" />
              Đánh dấu tất cả đã đọc
            </Button>
          ) : null}
        </div>
      </div>

      <div className="px-6 py-6">{listContent}</div>
    </div>
  );
}
