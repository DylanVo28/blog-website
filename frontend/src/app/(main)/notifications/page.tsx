import { BellRing } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { NotificationList } from "@/components/notifications/NotificationList";

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        <section className="surface-panel rounded-[1.85rem] border border-border/70 px-6 py-6 shadow-[0_24px_70px_-46px_rgba(25,32,56,0.35)]">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-[1.4rem] bg-primary/10 text-primary">
              <BellRing className="size-6" />
            </div>

            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
                Phase 6
              </p>
              <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight">
                Notification Center
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Đây là nơi tập trung toàn bộ cập nhật realtime của bạn: comment mới, câu hỏi đang
                chờ phản hồi, câu trả lời từ AI hoặc tác giả và các biến động liên quan đến ví nội
                bộ.
              </p>
            </div>
          </div>
        </section>

        <NotificationList mode="page" />
      </div>
    </AuthGuard>
  );
}
