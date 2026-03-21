import { AuthGuard } from "@/components/auth/AuthGuard";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <PagePlaceholder
        phase="Phase 7"
        title="Dashboard tác giả đang chờ dữ liệu doanh thu."
        description="Route này đã được bảo vệ bởi proxy và auth guard để phase dashboard chỉ tập trung vào chart và analytics."
      />
    </AuthGuard>
  );
}
