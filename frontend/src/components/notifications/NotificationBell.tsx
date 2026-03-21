"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notificationStore";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-white/70 text-foreground transition-colors hover:bg-accent",
        className,
      )}
      aria-label="Mở thông báo"
    >
      <Bell className="size-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
