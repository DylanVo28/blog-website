"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { NotificationList } from "@/components/notifications/NotificationList";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notificationStore";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const hydrated = useNotificationStore((state) => state.hydrated);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "surface-panel relative inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_16%,transparent),transparent_62%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_72%,var(--color-accent)_28%))] text-foreground shadow-sm transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-md",
            className,
          )}
          aria-label="Mở thông báo"
        >
          <Bell className="size-4" />
          {hydrated && unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="paper-grid flex h-full w-[min(92vw,30rem)] flex-col gap-0 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Thông báo</SheetTitle>
          <SheetDescription>Danh sách thông báo realtime của tài khoản hiện tại.</SheetDescription>
        </SheetHeader>
        <NotificationList mode="panel" onItemSelect={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
