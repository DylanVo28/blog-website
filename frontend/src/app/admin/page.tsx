import { AuthGuard } from "@/components/auth/AuthGuard";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function AdminPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <PagePlaceholder
        phase="Phase 8"
        title="Admin dashboard sẽ được hoàn thiện ở phase admin."
        description="Route này đã có proxy gate theo cookie role và auth guard client-side để chuẩn bị cho panel quản trị."
      />
    </AuthGuard>
  );
}
