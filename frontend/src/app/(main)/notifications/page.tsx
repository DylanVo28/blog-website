import { AuthGuard } from "@/components/auth/AuthGuard";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <PagePlaceholder
        phase="Phase 6"
        title="Notifications realtime sẽ được ghép sau."
        description="Socket client, notification bell và route protection đã sẵn sàng để cắm notification store ở phase realtime."
      />
    </AuthGuard>
  );
}
